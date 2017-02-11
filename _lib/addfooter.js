const fs = require('fs');
const cheerio = require('cheerio');
const extend = require('extend');
const through = require('through2');
const logger = require('gulplog');

function addFooter(footer, file, next) {
  if (file.relative.endsWith('.html')) {
    logger.debug('adding footer to %s', file.relative);
    var $ = cheerio.load(file.contents);
    $('body').append(footer);
    file.contents = new Buffer($.html());
  }
  next(null, file);
}

module.exports = function(footer) {
  return through.obj((data, enc, cb) => {
    addFooter(footer, data, cb);
  });
};