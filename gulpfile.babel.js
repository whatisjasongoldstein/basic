// Build tools
import gulp from 'gulp';
import del from 'del';
import browserSync from 'browser-sync';

// HTML
import nunjucksRender from 'gulp-nunjucks-render';
import { manageEnvironment } from './template';

// CSS
import sass from 'gulp-sass';
import autoprefixer from 'gulp-autoprefixer';


// Replace this with anything you npm install that 
// should be part of the website.
NPM_INSTALLED_LIBS = [
  'node_modules/lazysizes/lazysizes.min.js',
]

const server = browserSync.create();

const destinations = {
  dev: '.tmp',
  dist: 'docs',
}

// Generate HTML from pages. You can include
// any file in the templates or markdown directory.
const createHTML = async (dest) => {
  return gulp.src('src/templates/pages/**/*.html')
    .pipe(nunjucksRender({
      path: [
        'src/templates/',
        'src/markdown/',
      ],
      manageEnv: manageEnvironment,
    }))
    .pipe(gulp.dest(dest))
}

// SASS
const createCSS = (dest) => {
  return gulp.src(['src/**/*.scss'])
    .pipe(sass())
    .pipe(autoprefixer())
    .pipe(gulp.dest(dest))
}

// Just copies. I'll add rollup one day when I decide how
// it should lazy load
const createJS = (dest) => {
  return gulp.src(['src/**/*.js'])
    .pipe(gulp.dest(dest))
}

// Just copying
const createImages = (dest) => {
  return gulp.src(['src/**/*.{jpg,jpeg,png,svg}'])
    .pipe(gulp.dest(dest))
}


// Clear out the docs folder, but don't touch CNAME
// which github puts there
const clean = (dest) => {
  return del([
    `${ dest }/*`,
    `!${ dest }/CNAME`,
  ]);
}

// Copies third assets that you npm install like
// libraries and frameworks
const copyLibs = (dest) => {
  return gulp.src(NPM_INSTALLED_LIBS).pipe(gulp.dest(`${ dest }/lib`));
}

/**
 * Make browsersync.reload work with Gulp 4
 * @See: https://github.com/gulpjs/gulp/issues/1626
 */
function reload(done) {
  server.reload();
  return done();
}

const build = async (dest) => {
  await clean(dest);

  return Promise.all([
    createImages(dest),
    createHTML(dest),
    createCSS(dest),
    createJS(dest),
    copyLibs(dest),
  ])
}

// Prepare to ship it
gulp.task('dist', () => {
  return build(destinations.dist);
})

// Work locally
gulp.task('develop', async (done) => {
  await build(destinations.dev);

  gulp.watch('src/**/*', gulp.series([
    () => build(destinations.dev),
    reload,
  ]));

  server.init({
    notify: true,
    port: 9000,
    open: false,
    startPath: '/',
    server: {
      baseDir: ['.tmp']
    }
  }, done);

});

gulp.task('default', gulp.series(['develop']));