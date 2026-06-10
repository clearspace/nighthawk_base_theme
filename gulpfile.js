'use strict';

const { src, dest, series, parallel, watch } = require('gulp');
const gulpSass = require('gulp-sass');
const dartSass = require('sass');
const sourcemaps = require('gulp-sourcemaps');
const cleanCss = require('gulp-clean-css');
const rename = require('gulp-rename');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const sassGlob = require('gulp-sass-glob');
const postcssInlineSvg = require('postcss-inline-svg');
const browserSync = require('browser-sync').create();
const pxtorem = require('postcss-pxtorem');

const sass = gulpSass(dartSass);

const paths = {
  scss: {
    src: './scss/style.scss',
    bootstrap: './node_modules/bootstrap/scss/bootstrap.scss',
    watch: './scss/**/*.scss',
    dest: './css',
  },
  js: {
    bootstrap: './node_modules/bootstrap/dist/js/bootstrap.min.js',
    popper: './node_modules/@popperjs/core/dist/umd/popper.min.js',
    barrio: '../../contrib/bootstrap_barrio/js/barrio.js',
    dest: './js',
  },
};

const postcssProcessors = [
  postcssInlineSvg({
    removeFill: true,
    paths: ['./node_modules/bootstrap-icons/icons'],
  }),

  pxtorem({
    propList: [
      'font',
      'font-size',
      'line-height',
      'letter-spacing',
      '*margin*',
      '*padding*',
    ],
    mediaQuery: true,
  }),

  autoprefixer(),
];

// Compile Sass into CSS, create sourcemaps, minify, and inject changes.
function styles() {
  return src([paths.scss.bootstrap, paths.scss.src])
    .pipe(sassGlob())
    .pipe(sourcemaps.init())
    .pipe(
      sass({
        includePaths: [
          './node_modules/bootstrap/scss',
          '../../contrib/bootstrap_barrio/scss',
        ],
        silenceDeprecations: ['legacy-js-api'],
      }).on('error', sass.logError)
    )
    .pipe(postcss(postcssProcessors))
    .pipe(dest(paths.scss.dest))
    .pipe(cleanCss())
    .pipe(rename({ suffix: '.min' }))
    .pipe(sourcemaps.write('.'))
    .pipe(dest(paths.scss.dest))
    .pipe(browserSync.stream());
}

// Copy JavaScript dependencies into the theme js folder.
function scripts() {
  return src([
    paths.js.popper,
    paths.js.bootstrap,
    paths.js.barrio,
  ])
    .pipe(dest(paths.js.dest))
    .pipe(browserSync.stream());
}

// Start BrowserSync.
function serve(done) {
  browserSync.init({
    proxy: 'https://nighthawk_base.lndo.site',
    open: false,
    notify: false,
  });

  done();
}

// Reload BrowserSync manually when needed.
function reload(done) {
  browserSync.reload();
  done();
}

// Watch files for changes.
function watcher() {
  watch([paths.scss.watch, paths.scss.bootstrap], styles);
  watch(
    [paths.js.bootstrap, paths.js.popper, paths.js.barrio],
    series(scripts, reload)
  );
}

// Build once and exit.
const build = parallel(styles, scripts);

// Build, serve, and keep watching.
const dev = series(build, serve, watcher);

exports.styles = styles;
exports.js = scripts;
exports.scripts = scripts;
exports.build = build;
exports.serve = dev;
exports.watch = dev;

// Plain `gulp` now compiles, starts BrowserSync, and keeps listening.
exports.default = dev;