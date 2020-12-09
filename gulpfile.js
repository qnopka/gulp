const {task, src, dest, watch, series, parallel} = require('gulp');
const sass = require('gulp-sass');
const browserSync = require('browser-sync');
const notify = require('gulp-notify');
const cssnano = require('cssnano');
const rename = require('gulp-rename');
const postcss = require('gulp-postcss');
const csscomb = require('gulp-csscomb');
const autoprefixer = require('autoprefixer');
const mqpacker = require('css-mqpacker');
const sortCSSmq = require('sort-css-media-queries');
const uglify = require('gulp-uglify');
const terser = require('gulp-terser');
const concat = require('gulp-concat');
const del = require('del');

const PATH = {
    scssFile: './assets/scss/style.scss',
    scssFiles: './assets/scss/**/*.scss',
    scssFolder: './assets/scss',
    cssFolder: './assets/css',
    htmlFiles: './*.html',
    jsFiles: [
        './assets/js/**/*.js',
        '!./assets/js/**/*.min.js',
        '!./assets/js/**/all.js'
    ],
    jsFolder: './assets/js',
    jsBundleName: 'all.js',
    buildFolder: 'dest'
};

const PLUGINS = [
    autoprefixer({overrideBrowserslist: ['last 5 version', '> 0.1%'], cascade: true}),
    mqpacker({sort: sortCSSmq})
];

function scss () {
    return src(PATH.scssFile)
        .pipe(sass({outputStyle: 'expanded'}).on('error', sass.logError))
        .pipe(postcss(PLUGINS))
        .pipe(dest(PATH.cssFolder))
        .pipe(notify({message: '---------------------------SCSS --> CSS Compiled'}))
        .pipe(browserSync.stream());
}

function scssMin () {
    const pluginsExtended = PLUGINS.concat([
        cssnano({preset: 'default'})
    ]);

    return src(PATH.scssFile)
        .pipe(sass({outputStyle: 'expanded'}).on('error', sass.logError))
        .pipe(postcss(pluginsExtended))
        .pipe(rename({suffix: '.min'}))
        .pipe(dest(PATH.cssFolder))
        .pipe(notify({message: '-----------------------SCSS --> .min.css Compiled'}))
        .pipe(browserSync.stream());
}

function scssDev () {
    return src(PATH.scssFile, {sourcemaps: true})
        .pipe(sass({outputStyle: 'expanded'}).on('error', sass.logError))
        .pipe(dest(PATH.cssFolder, {sourcemaps: true}))
        .pipe(notify({message: '---------------------------SCSS in DEV mode'}))
        .pipe(browserSync.stream());
}

function comb() {
    return src(PATH.scssFiles)
        .pipe(csscomb()
            .on('error', notify.onError(function (error) {
                    return 'File: ' + error.message
                }
            )))
        .pipe(dest(PATH.scssFolder))
}

function syncInit() {
    browserSync.init({
        server: {
            baseDir: './'
        }
    });
}

async function sync() {
    browserSync.reload()
}

function watchFiles () {
    syncInit();
    watch(PATH.scssFiles, scss)
    watch(PATH.htmlFiles, sync)
    watch(PATH.jsFiles, sync)
}

function concatJs () {
    return src(PATH.jsFiles)
        .pipe(concat(PATH.jsBundleName))
        .pipe(dest(PATH.jsFolder))
}

function uglifyJS() {
    return src(PATH.jsFiles)
        .pipe(uglify({
            toplevel: true,
            output: {quote_style: 3}
        }))
        .pipe(rename({suffix: '.min'}))
        .pipe(dest(PATH.jsFolder))
}

function uglifyES6() {
    return src(PATH.jsFiles)
        .pipe(terser({
            toplevel: true,
            output: {quote_style: 3}
        }))
        .pipe(rename({suffix: '.min'}))
        .pipe(dest(PATH.jsFolder))
}

function buildJS () {
    return src(PATH.jsFolder + '/**/*.min.js')
        .pipe(dest(PATH.buildFolder + '/js'))
}

function buildHTML () {
    return src(PATH.htmlFiles)
        .pipe(dest(PATH.buildFolder + '/templates'))
}

function buildCSS() {
    return src(PATH.cssFolder + '/*.min.css')
        .pipe(dest(PATH.buildFolder + '/css'))
}

async function clearFolder() {
    await del(PATH.buildFolder, {forse: true});
    return true;
}

task('scss', series(scss, scssMin));
task('min', scssMin);
task('dev', scssDev);
task('comb', comb);
task('concat', concatJs);
task('uglify', uglifyJS);
task('es6', uglifyES6);
task('build', series(clearFolder, parallel(buildHTML, buildCSS, buildJS)));
task('watch', watchFiles);
