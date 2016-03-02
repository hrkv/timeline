'use strict';

var browserify = require('browserify'),
	gulp = require('gulp'),
    concatCss = require('gulp-concat-css'),
    minifyCSS = require('gulp-minify-css'),
	gutils = require('gulp-util'),
	jshint = require('gulp-jshint'),
	source = require('vinyl-source-stream');


gulp.task('js', function() {
    return browserify('./src/js/app.js')
        .bundle()
        .on('error', function (e) {
            gutils.log(e);
        })
        .pipe(source('app.js'))
        .pipe(gulp.dest('./build/js'));
});

gulp.task('jshint', function() {
	return gulp.src('./src/js/*.js')
		.pipe(jshint())
		.pipe(jshint.reporter('default'))
});

gulp.task('css', function () {
    return gulp.src('src/css/*.css')
      .pipe(concatCss("style.css"))
      .pipe(minifyCSS({ keepBreaks: true }))
      .pipe(gulp.dest('build/css'));
});

gulp.task('watch', function () {
    gulp.watch('src/*.js', ['js']);
});

gulp.task('default', ['jshint', 'js', 'css']);