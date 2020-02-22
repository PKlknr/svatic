const path = require('path');

const {runSnowpack} = require('./build');
const {findPageDeps} = require('./lib/lex');
const {findPageBySrcPath} = require('./lib/pageMap');
const {renderPage} = require('./render');
const {makeHydrators} = require('./hydrator');
const maybeLog = require('./lib/maybeLog');
const {transformFiles} = require('./lib/hydratorBabelTransform');

const findTouchedPages = (pageDeps, pageMap, filename) =>
  pageDeps
    .filter(([, deps]) => deps.has(filename + '.js'))
    .map(([entry]) => entry)
    .map(p => findPageBySrcPath(pageMap, p));

const maybeSnowpack = (destDir, entries) =>
  findPageDeps(destDir, entries).catch(e => {
    if (e.code === 'ENOENT') {
      maybeLog('new dependency - running snowpack');
      return runSnowpack(destDir).then(() => findPageDeps(destDir, entries));
    } else {
      throw e;
    }
  });

const buildDependecy = (srcDir, destDir, pageMap, pageDeps, relToSrc) =>
  // When a component changes, we must
  // * render the html of all pages this component is included in
  // * and the hydrator for this component
  Promise.all(
    findTouchedPages(pageDeps, pageMap, relToSrc).map(page =>
      renderPage(srcDir, destDir, page.src, page.dest, page.hydratable),
    ),
  )
    .then(() => makeHydrators(srcDir, destDir, [path.join(srcDir, relToSrc)]))
    .then(() =>
      transformFiles(destDir, [path.join(destDir, relToSrc + '.js')]),
    );

const buildPage = (srcDir, destDir, page) =>
  // When a page changes, we must
  // * render the html
  // * and the hydrator of that page
  renderPage(srcDir, destDir, page.src, page.dest, page.hydratable)
    .then(() => {
      if (page.hydratable) {
        return makeHydrators(srcDir, destDir, [path.join(srcDir, page.src)]);
      }
    })
    .then(() =>
      transformFiles(destDir, [path.join(destDir, page.src + '.js')]),
    );

module.exports.makeBuildPartial = (srcDir, destDir) => (
  pageMap,
  pageDeps,
  changedFile,
) => {
  const relToSrc = path.relative(srcDir, changedFile);

  maybeLog('file changed:', relToSrc);

  const page = findPageBySrcPath(pageMap, relToSrc);
  return (page
    ? buildPage(srcDir, destDir, page)
    : buildDependecy(srcDir, destDir, pageMap, pageDeps, relToSrc)
  ).then(() =>
    maybeSnowpack(
      destDir,
      pageMap.map(({src}) => src),
    ),
  );
};
