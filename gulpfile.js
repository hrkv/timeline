'use strict';

var browserify = require('browserify'),
	gulp = require('gulp'),
	gutils = require('gulp-util'),
	jshint = require('gulp-jshint'),
	source = require('vinyl-source-stream');


gulp.task('build', function() {
    return browserify('./src/app.js')
        .bundle()
        .on('error', function (e) {
            gutils.log(e);
        })
        .pipe(source('app.js'))
        .pipe(gulp.dest('./'));
});

gulp.task('jshint', function() {
	return gulp.src('./src/*js')
		.pipe(jshint())
		.pipe(jshint.reporter('default'))
});

gulp.task('watch', function () {
    gulp.watch('src/*.js', ['js']);
});

gulp.task('default', ['jshint', 'build']);