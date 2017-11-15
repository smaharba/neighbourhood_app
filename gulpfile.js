// include gulp
var gulp = require('gulp');
 
// include plug-ins
var browserify = require('browserify');
var babelify = require('babelify');
var source = require('vinyl-source-stream');
var babel = require("gulp-babel");
var changed = require('gulp-changed');
var jshint = require('gulp-jshint');
var imagemin = require('gulp-imagemin');
var minifyHTML = require('gulp-minify-html');
var concat = require('gulp-concat');
var stripDebug = require('gulp-strip-debug');
var uglify = require('gulp-uglify');
var autoprefix = require('gulp-autoprefixer');
var minifyCSS = require('gulp-minify-css');
var pump = require('pump');

// minify new or changed HTML pages
gulp.task('htmlpage', function() {
  var htmlSrc = './src/*.html',
      htmlDst = './build';      
  gulp.src(htmlSrc)
    .pipe(changed(htmlDst))
    .pipe(minifyHTML())
    .pipe(gulp.dest(htmlDst));
});

// CSS concat, auto-prefix and minify
//The autoprefixer plug-in is passed a string or array indicating the level of browser support — in this case, we want the current and previous versions of all mainstream browsers. It looks up each property at caniuse.com and adds additional vendor-prefixed properties when necessary.
gulp.task('styles', function() {
  gulp.src(['./src/css/*.css'])
    .pipe(autoprefix('last 2 versions'))
    .pipe(minifyCSS())
    .pipe(gulp.dest('./build/css/'));
});

// minify new images
gulp.task('imagemin', function() {
  var imgSrc = './src/img/**/*',
      imgDst = './build/img';
  gulp.src(imgSrc)
    .pipe(changed(imgDst))
    .pipe(imagemin())
    .pipe(gulp.dest(imgDst)); 
});

// JS hint task
gulp.task('jshint', function() {
  gulp.src('./src/js/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

//dit werkt niet (krijg foutmelding bij starten app "getAreas is not a function"):
gulp.task('build', function() {
	return browserify({entries: './src/js/app.js', debug: true})
		.transform(babelify, {presets: ["es2015"]})
		.bundle()
		.pipe(source('app.js'))
		.pipe(gulp.dest('./build/js/'))
});

// JS concat, strip debugging (and minify)
//This passes an array of filenames to gulp.src(); I want app.js to appear at the top of the production file followed by all other JavaScript files in any order.
gulp.task('js', function() {
  gulp.src(['./src/js/app.js','./src/js/*.js'])
    .pipe(stripDebug())
    .pipe(uglify())
    .pipe(gulp.dest('./build/js/'));
});

//watch for changes
gulp.task('watch', function () {
	gulp.watch('./src/*.html', ['htmlpage']);
	gulp.watch('./src/js/*.js', ['js']);
	gulp.watch('./src/css/*.css', ['styles']);
	gulp.watch('./src.js/*.js', ['build']);
	});

// default gulp task
gulp.task('default', ['htmlpage', 'styles', 'imagemin', 'jshint', 'js', 'build', 'watch']);
