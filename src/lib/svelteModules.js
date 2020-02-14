// Ugly hack - see https://github.com/PKlknr/svatic/issues/17

const writeOutputFile = require('./writeOutputFile');
const path = require('path');
const glob = require('glob');
const {makeHydrators} = require('../hydrator');

module.exports.writeExternalSvelteDeps = async (destDir, bundle) =>
  Promise.all(
    bundle.cache.modules
      .filter(x => x.id.includes('node_modules'))
      .map(x =>
        writeOutputFile(
          path.join(
            destDir,
            '/web_modules/',
            x.id.replace(/^.*node_modules./, ''),
          ),
          x.originalCode,
        ),
      ),
  );

module.exports.hydrateExternalSvelteDeps = async destDir => {
  const extSv = glob.sync(path.join(destDir, 'web_modules/**/*.svelte'));
  /* eslint-disable-next-line no-console */
  console.log('external svelte files:', extSv);

  return makeHydrators(destDir, destDir, destDir, extSv);
};
