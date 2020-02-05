const {injectIntoBody} = require('./lib');
const {snowpack, maybeLog} = require('./lib');
const fs = require('fs');
const path = require('path');

const glob = require('glob');

const findSvelteFiles = async srcDir =>
  glob
    .sync(srcDir + '/**/!(*+(spec|test)).+(svelte)', {nodir: true})
    .map(x => path.normalize(x));

const transform = require('./lib/hydratorBabelTransform');
const compileSvelteFile = require('./lib/compileSvelte');

module.exports.injectHydratorLoader = (srcDir, input, props) =>
  injectIntoBody(`
    <script type="module">
      import Hydra from '${path.join('/', input)}.js';
        new Hydra({
          target: document,
          hydrate: true,
          props: ${JSON.stringify(props)}
        });
    </script>`);

const destPath = (srcDir, destDir, input) =>
  path.join(destDir, input.substr(path.normalize(srcDir).length)) + '.js';

const svelteCompileAndWriteAll = (srcDir, destDir, inputs) =>
  Promise.all(
    inputs.map(input =>
      compileSvelteFile(input).then(compiled => {
        maybeLog('Writing compiled for snowpack', destPath);
        writeOutputFile(destPath(srcDir, destDir, input), compiled);
        return compiled;
      }),
    ),
  );

const runSnowpack = (tmpDir, destDir) =>
  snowpack({
    include: path.join(tmpDir + '/**/*'),
    dest: path.join(destDir, 'web_modules'),
  });

module.exports.runSnowpack = runSnowpack;

const transformAndRewriteAll = (srcDir, destDir, inputs, code) =>
  Promise.all(
    code.map((code, i) =>
      transform(code).then(
        transformed =>
          maybeLog('Writing hydrator', inputs[i]) ||
          writeOutputFile(destPath(srcDir, destDir, inputs[i]), transformed),
      ),
    ),
  );

// we need tmpdir because snowpack would fail to run after transformation
// (cannot find svelte/internal.js
module.exports.makeHydrators = (srcDir, tmpDir, destDir, inputs) =>
  // This compiles every Svelte-component.
  // TODO: Find a way to only compile those actually needed.
  maybeLog('makeHydrators', srcDir, tmpDir, destDir, inputs) ||
  (inputs ? Promise.resolve(inputs) : findSvelteFiles(srcDir)).then(inputs =>
    svelteCompileAndWriteAll(srcDir, tmpDir, inputs).then(compiled =>
      transformAndRewriteAll(tmpDir, destDir, inputs, compiled),
    ),
  );

const writeOutputFile = (destPath, content) =>
  maybeLog('writeOutputFile', destPath) ||
  fs.promises
    .mkdir(path.dirname(destPath), {recursive: true})
    .then(() => fs.promises.writeFile(destPath, content));
