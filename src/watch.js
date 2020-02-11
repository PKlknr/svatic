const path = require('path');
const chokidar = require('chokidar');
const {buildImportMap} = require('./lib/lex');

const {build, runSnowpack} = require('./build');
const {makeHydrators} = require('./hydrator');
const {renderPage} = require('./render');
const {evalPageMap} = require('./lib/pageMap');

const logError = require('./lib/logError');

const maybeSnowpack = (tmpDir, destDir, pageMap) =>
  buildImportMap(
    destDir,
    pageMap.map(({src}) => src),
  ).catch(e => {
    if (e.code === 'ENOENT') {
      console.log('new dependency - running snowpack');
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

const bustRequireCache = srcDir =>
  Object.keys(require.cache)
    .filter(x => x.startsWith(path.resolve(srcDir)))
    .forEach(x => delete require.cache[x]);

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

const makeQueue = onFinish => {
  let q = [];
  let busy = false;

  const run = () => {
    if (!q.length) {
      return;
    }
    busy = true;
    const f = q[0];
    q = q.slice(1);
    Promise.resolve(f())
      .catch(e => {
        console.error('E', e);
        onFinish(e);
      })
      .then(() => {
        if (q.length) {
          run();
        } else {
          busy = false;
          onFinish();
        }
      });
  };

  return filename => {
    q = [...q, filename];
    if (!busy) {
      run();
    }
  };
};

module.exports.watch = ({
  srcDir = './src',
  tmpDir = './tmp',
  destDir = './dist',
  pageMap,
  hooks = [],
  afterBuild = () => {},
} = {}) => {
  let importMap;

  const handleFile = (srcDir, tmpDir, destDir, pageMap) => p => {
    const t = Date.now();
    const relToSrc = toSrcPath(srcDir, p);
    if (relToSrc) {
      console.log('file changed:', relToSrc);

      const page = findPageBySrcPath(pageMap, relToSrc);
      bustRequireCache(srcDir);
      return (page
        ? handlePageChange(srcDir, tmpDir, destDir, page)
        : handleComponentChange(
          srcDir,
          tmpDir,
          destDir,
          pageMap,
          importMap,
          relToSrc,
        )
      )
        .then(() => maybeSnowpack(tmpDir, destDir, pageMap))
        .then(m => (importMap = m))
        .then(() =>
          console.log('partial build done in', Date.now() - t, 'ms\n'),
        )
        .catch(e => {
          logError(e);
          afterBuild(e);
        });
    } else {
      return Promise.resolve();
    }
  };
  const queue = makeQueue(afterBuild);

  const onFileEvent = ( p) => {
    hooks
      .filter(x => x.filter && x.filter(p))
      .forEach(hook => {
        queue(() => hook.task(p));
      });
    if (p.endsWith('.svelte')) {
      queue(() => handleFile(srcDir, tmpDir, destDir, evalPageMap(pageMap))(p));
    }
  };

  build({srcDir, tmpDir, destDir, pageMap, hooks, afterBuild})
    .then(() => evalPageMap(pageMap))
    .then(pageMap =>
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
        .on('change', onFileEvent)
        .on('add', onFileEvent);
    });
};
