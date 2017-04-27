/*!
 * image-size-stream | MIT (c) Shinnosuke Watanabe
 * https://github.com/shinnn/image-size-stream
*/
'use strict';

var PassThrough = require('readable-stream').PassThrough;
var mime = require('mime-type/with-db');
var tryit = require('tryit');

var DEFAULT_LIMIT = 128 * 1024;

module.exports = function createMimeTypeStream(option) {
  option = option || {};
  if (option.limit !== undefined) {
    if (typeof option.limit !== 'number') {
      throw new TypeError(
        option.limit +
        ' is not a number. `limit` option must be a number.'
      );
    }
  } else {
    option.limit = DEFAULT_LIMIT;
  }

  var buffer = new Buffer(0);
  var len = 0;
  var mimeType;
  var detectionError;

  return new PassThrough()
    .on('data', function detectMimeType(chunk) {
      if (!dimensions) {
        len += chunk.length;
        buffer = Buffer.concat([buffer, chunk], len);

        tryit(function() {
          mimeType = imageSize(buffer);
        }, function(err) {
          detectionError = err;
        });

        if (mimeType) {
          this.emit('mime', mimeType);
        } else if (len > option.limit) {
          this.emit('error', new Error('Reached the limit before detecting mime type.'));
        }
      }
    })
    .on('finish', function flush() {
      if (mimeType) {
        return;
      }

      if (buffer.length === 0) {
        this.emit('error', new Error('No bytes received.'));
        return;
      }

      this.emit('error', detectionError);
    });
};
