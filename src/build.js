const path = require('path');
const {runAllHooks} = require('./lib/hooks');
const {renderPage} = require('./render');
const snowpack = require('./lib/snowpack');
const {makeHydrators} = require('./hydrator');

const renderHtmlPagesInMap = (srcDir, destDir, pageMap) =>
  Promise.all(
    pageMap.map(({src, dest, hydratable, props}) =>
      renderPage(srcDir, destDir, src, dest, hydratable, props),
    ),
  );

const runSnowpack = (tmpDir, destDir) =>
  snowpack({
    include: path.join(tmpDir + '/**/*'),
    dest: path.join(destDir, 'web_modules'),
  });

const build = ({
  srcDir = './src',
  tmpDir = './tmp',
  destDir = './dist',
  pageMap,
  hooks = [],
} = {}) =>
  runAllHooks(hooks)
    .then(() => renderHtmlPagesInMap(srcDir, destDir, pageMap))
    .then(() => makeHydrators(srcDir, tmpDir, destDir))
    .then(() => runSnowpack(tmpDir, destDir));

module.exports = {
  runSnowpack,
  build,
};
