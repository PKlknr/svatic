const path = require('path');
const chokidar = require('chokidar');
const {buildImportMap} = require('./lib/lex');

const {build, runSnowpack} = require('./build');
const {makeHydrators} = require('./hydrator');

const {maybeLog} = require('./lib');
const {renderPage} = require('./render');

const maybeSnowpack = (tmpDir, destDir, pageMap) =>
  buildImportMap(
    destDir,
    pageMap.map(({src}) => src),
  ).catch(e => {
    if (e.code === 'ENOENT') {
      maybeLog('NEW DEP');
      return runSnowpack(tmpDir, destDir).then(() =>
        buildImportMap(
          destDir,
          pageMap.map(({src}) => src),
        ),
      );
    } else {
      throw e;
    }
  });

const bustRequireCache = srcDir => {
  const cabef = Object.keys(require.cache).length;
  Object.keys(require.cache)
    .filter(x => x.startsWith(path.resolve(srcDir)))
    .forEach(x => delete require.cache[x]);
  maybeLog('busted', cabef - Object.keys(require.cache).length);
};

const toSrcPath = (srcDir, p) =>
  path.normalize(p).startsWith(path.normalize(srcDir))
    ? path.relative(srcDir, p)
    : undefined;

const findPageBySrcPath = (pageMap, p) => pageMap.find(x => x.src === p);

const findTouchedPages = (importMap, pageMap, filename) =>
  importMap
    .filter(([, value]) => value.has(filename + '.js'))
    .map(([key]) => key)
    .map(p => findPageBySrcPath(pageMap, p));

const handlePageChange = (srcDir, tmpDir, destDir, page) =>
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

const handleComponentChange = (
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

const makeQueue = () => {
  let q = [];
  let busy = false;

  const run = () => {
    if (!q.length) {
      return;
    }
    if (!busy) {
      busy = true;
      const f = q[0];
      q = q.slice(1);
      f()
        .then(() => (busy = false))
        .catch(e => {
          console.error('E', e);
          busy = false;
        })
        .then(run);
    }
  };

  return filename => {
    q = [...q, filename];
    run();
  };
};

module.exports.watch = ({
  srcDir = './src',
  tmpDir = './tmp',
  destDir = './dist',
  pageMap,
  hooks = [],
} = {}) => {
  let importMap;

  const handleFile = (srcDir, tmpDir, destDir, pageMap) => p => {
    const relToSrc = toSrcPath(srcDir, p);
    if (relToSrc) {
      maybeLog('  IS SRC', relToSrc);

      const page = findPageBySrcPath(pageMap, relToSrc);
      bustRequireCache(srcDir);
      return (page
        ? maybeLog('  >>> A PAGE') ||
          handlePageChange(srcDir, tmpDir, destDir, page)
        : maybeLog('  >>> NOT A PAGE') ||
          handleComponentChange(
            srcDir,
            tmpDir,
            destDir,
            pageMap,
            importMap,
            relToSrc,
          )
      )
        .then(() => maybeSnowpack(tmpDir, destDir, pageMap))
        .then(m => (importMap = m));
    } else {
      return Promise.resolve();
    }
  };
  const queue = makeQueue();

  build({srcDir, tmpDir, destDir, pageMap, hooks})
    .then(() =>
      buildImportMap(
        destDir,
        pageMap.map(({src}) => src),
      ),
    )

    .then(m => {
      importMap = m;

      chokidar
        .watch([srcDir], {
          ignoreInitial: true,
          atomic: false,
        })
        .on('all', (event, p) => {
          maybeLog('file event', event, p);

          hooks
            .filter(x => x.filter && x.filter(p))
            .forEach(hook => {
              console.log('PP RUN HOOK');
              queue(hook.task);
            });
          if (p.endsWith('.svelte')) {
            queue(() => handleFile(srcDir, tmpDir, destDir, pageMap)(p));
          }
        });
    });
};
