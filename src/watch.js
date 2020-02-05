const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');

const {makeHtmlWithStyle} = require('./makeHtml');

const {
  injectHydratorLoader,
  makeHydrators,
  runSnowpack,
} = require('./hydrator');

const {maybeLog} = require('./lib');

const renderOne = (srcDir, destDir, src, dest, hydratable) => {
  const html = makeHtmlWithStyle(srcDir, src);
  const h2 = hydratable ? injectHydratorLoader(srcDir, src)(html) : html;
  maybeLog('renderOne writes', path.join(destDir, dest));
  return fs.promises.writeFile(path.join(destDir, dest), h2);
};

const fullBuild = (srcDir, tmpDir, destDir, pageMap) =>
  Promise.all(
    pageMap.map(({src, dest, hydratable}) =>
      renderOne(srcDir, destDir, src, dest, hydratable),
    ),
  )
    .then(() => makeHydrators(srcDir, tmpDir, destDir))
    .then(() => runSnowpack(tmpDir, destDir));

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

const {buildImportMap} = require('./lib/lex');
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
  renderOne(srcDir, destDir, page.src, page.dest, page.hydratable).then(() => {
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
      renderOne(srcDir, destDir, page.src, page.dest, page.hydratable),
    ),
  ).then(() =>
    makeHydrators(srcDir, tmpDir, destDir, [path.join(srcDir, relToSrc)]),
  );

module.exports = (srcDir, tmpDir, destDir, pageMap) => {
  let importMap;
  const queue = (() => {
    let q = [];
    let busy = false;

    const run = () => {
      if (!busy) {
        const f = q[0];
        q = q.slice(1);
        handleFile(srcDir, tmpDir, destDir, pageMap, f)
          .then(() => (busy = false))
          .catch(e => {
            console.error('E', e);
            busy = false;
          });
      }
    };

    return filename => {
      q = [...q, filename];
      run();
    };
  })();

  const handleFile = (srcDir, tmpDir, destDir, pageMap, p) => {
    const relToSrc = toSrcPath(srcDir, p);
    if (relToSrc) {
      maybeLog('  IS SRC', relToSrc);

      const page = findPageBySrcPath(pageMap, relToSrc);
      bustRequireCache(srcDir);

      if (page) {
        maybeLog('  >>> A PAGE');
        return handlePageChange(srcDir, tmpDir, destDir, page)
          .then(() => maybeSnowpack(tmpDir, destDir, pageMap))
          .then(m => (importMap = m));
      } else {
        maybeLog('  >>> NOT A PAGE');
        return handleComponentChange(
          srcDir,
          tmpDir,
          destDir,
          pageMap,
          importMap,
          relToSrc,
        )
          .then(() => maybeSnowpack(tmpDir, destDir, pageMap))
          .then(m => (importMap = m));
      }
    } else {
      return Promise.resolve();
    }
  };

  fullBuild(srcDir, tmpDir, destDir, pageMap)
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
          queue(p);
        });
    });
};
