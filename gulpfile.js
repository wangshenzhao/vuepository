var gulp        = require('gulp');
var browserSync = require('browser-sync').create();
var sass        = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer')

// Static Server + watching scss/html files
gulp.task('serve', ['sass'], function() {

  browserSync.init({ server: "./" })

  gulp.watch("./sass/*.scss", ['sass'])

  gulp.watch("./css/*.css").on('change', browserSync.reload)
  gulp.watch("./page/*.html").on('change', browserSync.reload)
});

// Compile sass into CSS & auto-inject into browsers
gulp.task('sass', function() {
  return gulp.src("./sass/app.scss")
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer({
      browsers: ['last 4 versions'],
      cascade: false
    }))
    .pipe(gulp.dest("./css"))
});

gulp.task('default', ['serve'])