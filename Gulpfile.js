const gulp = require('gulp');
const ender = require('ender');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');
const f = require('util').format;

const ender_out = 's/ender.js';

gulp.task('ender', function(done) {
  ender.exec(f('ender build qwery bonzo bean --output %s', ender_out), done);
});

gulp.task('uglify', ['ender'], function() {
  return gulp.src(['s/ender.js', 's/lenskit.js'])
      .pipe(concat('lenskit.min.js'))
      .pipe(uglify())
      .pipe(gulp.dest('s'));
});

gulp.task('default', ['ender', 'uglify']);
