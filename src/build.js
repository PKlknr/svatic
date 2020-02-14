const path = require('path');
const {runAllHooks} = require('./lib/hooks');
const {renderPage} = require('./render');
const maybeLog = require('./lib/maybeLog');
const {hydrateExternalSvelteDeps} = require('./lib/svelteModules');
const snowpack = require('./lib/snowpack');
const {makeHydrators} = require('./hydrator');
const {evalPageMap} = require('./lib/pageMap');
const glob = require('glob');
const minify = require('./lib/minify');
const fs = require('fs');

const renderHtmlPagesInMap = (srcDir, destDir, pageMap) =>
  Promise.all(
    pageMap.map(({src, dest, hydratable, props}) =>
      renderPage(srcDir, destDir, src, dest, hydratable, props),
    ),
  );

const runSnowpack = (tmpDir, destDir) =>
  snowpack({
    optimize: process.env.NODE_ENV === 'production',
    include: path.join(tmpDir + '/**/*'),
    dest: path.join(destDir, 'web_modules'),
  });

const maybeMinify = destDir =>
  process.env.NODE_ENV === 'production'
    ? Promise.all(
      glob
        .sync(destDir + '/**/!(*+(spec|test)).+(js|mjs|svelte)', {
          nodir: true,
        })
        .filter(x => !x.includes('web_modules'))
        .map(minify),
    )
    : null;

const logError = require('./lib/logError');

const build = ({
  srcDir = './src',
  tmpDir = './tmp',
  destDir = './dist',
  pageMap,
  hooks = [],
  afterBuild = () => {},
} = {}) => {
  const t = Date.now();
  return Promise.all([
    fs.promises.mkdir(srcDir, {recursive: true}),
    fs.promises.mkdir(tmpDir, {recursive: true}),
    fs.promises.mkdir(destDir, {recursive: true}),
  ])
    .then(() => fs.promises.mkdir(tmpDir, {recursive: true}))
    .then(() => runAllHooks(hooks))
    .then(() => evalPageMap(pageMap))

    .then(pageMap => renderHtmlPagesInMap(srcDir, destDir, pageMap))
    .then(() => makeHydrators(srcDir, tmpDir, destDir))
    .then(() => runSnowpack(tmpDir, destDir))

    .then(() => hydrateExternalSvelteDeps(destDir))

    .then(() => maybeMinify(destDir))
    .then(afterBuild)
    .then(() => maybeLog('full build done in', Date.now() - t, 'ms\n'))
    .catch(e => logError(new Error(e)));
};

module.exports = {
  runSnowpack,
  build,
};
