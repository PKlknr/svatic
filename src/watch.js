const path = require('path');
const chokidar = require('chokidar');
const {buildImportMap} = require('./lib/lex');

const {build} = require('./build');
const {evalPageMap} = require('./lib/pageMap');
const makeQueue = require('./lib/queue');
const maybeLog = require('./lib/maybeLog');
const {makeBuildPartial} = require('./buildPartial');

const logError = require('./lib/logError');

const maybeQueueHooks = (queue, hooks, changedFile) =>
  hooks
    .filter(x => x.filter && x.filter(changedFile))
    .forEach(hook => {
      queue(() => hook.task(changedFile));
    });

module.exports.watch = ({
  srcDir = './src',
  tmpDir = './tmp',
  destDir = './dist',
  pageMap,
  hooks = [],
  afterBuild = () => {},
} = {}) => {
  let importMap;

  const queue = makeQueue(afterBuild);
  const buildPartial = makeBuildPartial(srcDir, tmpDir, destDir);

  const onFileEvent = changedFile => {
    maybeQueueHooks(queue, hooks, changedFile);
    if (changedFile.endsWith('.svelte')) {
      queue(() => {
        const t = Date.now();
        buildPartial(
          evalPageMap(pageMap),
          importMap,
          path.normalize(changedFile),
        )
          .then(m => (importMap = m)) // SFX
          .then(() => maybeLog('partial build done in', Date.now() - t, 'ms\n'))
          .catch(e => {
            // SFX
            logError(e);
            afterBuild(e);
          });
      });
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
