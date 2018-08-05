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

// JS
import gulpFn from 'gulp-fn';
import { rollup } from 'rollup';
import rollupBabelPlugin from 'rollup-plugin-babel';
import rollupNodeResolve from 'rollup-plugin-node-resolve';


// Replace this with anything you npm install that 
// should be part of the website.
const NPM_INSTALLED_LIBS = [
  // 'node_modules/lazysizes/lazysizes.min.js',
]

// What should rollup generate from its bundle files?
const jsExportFormat = 'iife';

const server = browserSync.create();

const destinations = {
  dev: '.tmp',
  dist: 'docs',
}

// Generate HTML from pages. You can include
// any file in the templates or markdown directory.
const createHTML = (dest) => {
  return gulp.src('src/templates/pages/**/*.html')
    .pipe(nunjucksRender({
      path: [
        'src/templates/',
        'src/markdown/',
      ],
      manageEnv: manageEnvironment,
    })).on('error', (e) => {
      console.error(`Nunjucks error! 🤬`)
      console.error(e.message);
      console.error(e.fileName);
    })
    .pipe(gulp.dest(dest))
}

// SASS
const createCSS = (dest) => {
  return gulp.src(['src/**/*.scss'])
    .pipe(sass())
    .pipe(autoprefixer())
    .pipe(gulp.dest(dest))
}

const babelConf = {
  babelrc: false,
  presets: [
    ['env', {
      "targets": {
        "browsers": [
          "last 2 versions",
        ]
      },
      modules: false
    }]
  ]
};

// Just copies. I'll add rollup one day when I decide how
// it should lazy load
const createJS = (dest) => {
  return gulp.src(['src/**/*.bundle.js'])
    .pipe(gulpFn(function(file) {
      const inpath = `src/${ file.relative }`;
      const outpath = `${ dest }/${ file.relative }`;

      return rollup({
        input: inpath,
        plugins: [
          rollupNodeResolve({
            jsnext: true,
            browser: true,
          }),
          rollupBabelPlugin(babelConf),
        ],
      }).then(function(bundle) {
        return bundle.write({
          format: jsExportFormat,
          file: outpath,
          name: "creative",
          sourcemap: true,
        });
      });
    }));
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
  if (NPM_INSTALLED_LIBS.length === 0) {
    return;
  }

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

  return await Promise.all([
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