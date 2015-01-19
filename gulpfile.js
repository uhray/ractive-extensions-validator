var gulp = require('gulp'),
    child = require('child_process');

// Top Level Commands ----------------------------------------------------------

gulp.task('default', ['info']);
gulp.task('lint', ['dolint']);
gulp.task('example', ['serve']);
gulp.task('build', ['dobuild']);

// Helper Tasks ----------------------------------------------------------------

gulp.task('info', function() {
  console.log('\nUsage:\t gulp [ lint | example | build ]\n');
});

gulp.task('dolint', function() {
  return child.spawn('./node_modules/.bin/jscs', ['./'],
                     { stdio: 'inherit' });
});

gulp.task('serve', function() {
  console.log('Go to http://127.0.0.1:8080/example/');
  return child.spawn('./node_modules/.bin/http-server', ['./'],
                     { stdio: 'inherit' });
});

gulp.task('dobuild', function() {
  var min = ['-o', 'build/config.js',
             'out=dist/validator.min.js', 'optimize=uglify'],
      max = ['-o', 'build/config.js', 'out=dist/validator.js', 'optimize=none'];

  child.spawn('./node_modules/.bin/r.js', min, { stdio: 'inherit' });
  return child.spawn('./node_modules/.bin/r.js', max, { stdio: 'inherit' });
});
