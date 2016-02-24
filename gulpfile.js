'use strict';

var browserify = require('browserify');
var gulp = require('gulp');
var gutils = require('gulp-util');
var source = require('vinyl-source-stream');

gulp.task('build', function() {
    return browserify('./src/app.js')
        .bundle()
        .on('error', function (e) {
            gutils.log(e);
        })
        .pipe(source('app.js'))
        .pipe(gulp.dest('./'));
});

gulp.task('watch', function () {
    gulp.watch('src/*.js', ['js']);
});

gulp.task('default', ['build', 'watch']);