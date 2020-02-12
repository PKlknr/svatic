const path = require('path');

const {runSnowpack} = require('./build');
const {buildImportMap} = require('./lib/lex');
const {findPageBySrcPath} = require('./lib/pageMap');
const {renderPage} = require('./render');
const {makeHydrators} = require('./hydrator');
const maybeLog = require('./lib/maybeLog');

const findTouchedPages = (importMap, pageMap, filename) =>
  importMap
    .filter(([, deps]) => deps.has(filename + '.js'))
    .map(([entry]) => entry)
    .map(p => findPageBySrcPath(pageMap, p));

const bustRequireCache = srcDir =>
  Object.keys(require.cache)
    .filter(x => x.startsWith(path.resolve(srcDir)))
    .forEach(x => delete require.cache[x]);

const maybeSnowpack = (tmpDir, destDir, entries) =>
  buildImportMap(destDir, entries).catch(e => {
    if (e.code === 'ENOENT') {
      maybeLog('new dependency - running snowpack');
      return runSnowpack(tmpDir, destDir).then(() =>
        buildImportMap(destDir, entries),
      );
    } else {
      throw e;
    }
  });

const buildDependecy = (
  srcDir,
  tmpDir,
  destDir,
  pageMap,
  importMap,
  relToSrc,
) =>
  // When a component changes, we must
  // * render the html of all pages this component is included in
  // * and the hydrator for this component
  Promise.all(
    findTouchedPages(importMap, pageMap, relToSrc).map(page =>
      renderPage(srcDir, destDir, page.src, page.dest, page.hydratable),
    ),
  ).then(() =>
    makeHydrators(srcDir, tmpDir, destDir, [path.join(srcDir, relToSrc)]),
  );

const buildPage = (srcDir, tmpDir, destDir, page) =>
  // When a page changes, we must
  // * render the html
  // * and the hydrator of that page
  renderPage(srcDir, destDir, page.src, page.dest, page.hydratable).then(() => {
    if (page.hydratable) {
      return makeHydrators(srcDir, tmpDir, destDir, [
        path.join(srcDir, page.src),
      ]);
    }
  });

module.exports.makeBuildPartial = (srcDir, tmpDir, destDir) => (
  pageMap,
  importMap,
  changedFile,
) => {
  const relToSrc = path.relative(srcDir, changedFile);

  maybeLog('file changed:', relToSrc);

  const page = findPageBySrcPath(pageMap, relToSrc);
  bustRequireCache(srcDir);
  return (page
    ? buildPage(srcDir, tmpDir, destDir, page)
    : buildDependecy(srcDir, tmpDir, destDir, pageMap, importMap, relToSrc)
  ).then(() =>
    maybeSnowpack(
      tmpDir,
      destDir,
      pageMap.map(({src}) => src),
    ),
  );
};
