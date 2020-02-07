const path = require('path');
const {runAllHooks} = require('./lib/hooks');
const {renderPage} = require('./render');
const snowpack = require('./lib/snowpack');
const {makeHydrators} = require('./hydrator');
const glob = require('glob');
const minify = require('./lib/minify');

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
        .map(minify),
    )
    : null;

const build = ({
  srcDir = './src',
  tmpDir = './tmp',
  destDir = './dist',
  pageMap,
  hooks = [],
  afterBuild = () => {},
} = {}) =>
  runAllHooks(hooks)
    .then(() => renderHtmlPagesInMap(srcDir, destDir, pageMap))
    .then(() => makeHydrators(srcDir, tmpDir, destDir))
    .then(() => runSnowpack(tmpDir, destDir))
    .then(() => maybeMinify(destDir))
    .then(afterBuild)
    .catch(e => {
      console.log(e);
      if (e.frame) {
        console.log(e.frame);
      }
      console.log('\n\nBuild failed\n\n');
    });

module.exports = {
  runSnowpack,
  build,
};
