var gulp = require('gulp');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');

gulp.task('uglify', function() {
  return gulp.src(['s/lenskit.js', 'bower_components/modernizr/modernizr.js'])
    .pipe(uglify({
      preserveComments: 'license'
    }))
    .pipe(rename(function(path) {
      path.dirname = ''
      path.basename += '.min'
    }))
    .pipe(gulp.dest('s'))
});
