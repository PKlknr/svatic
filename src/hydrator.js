const {injectIntoBody} = require('./lib');
const {maybeLog} = require('./lib');
const fs = require('fs');
const path = require('path');

const glob = require('glob');

const findSvelteFiles = async srcDir =>
  glob
    .sync(srcDir + '/**/!(*+(spec|test)).+(svelte)', {nodir: true})
    .map(x => path.normalize(x));

const transform = require('./lib/hydratorBabelTransform');
const compileSvelteFile = require('./lib/compileSvelte');

const destPath = (srcDir, destDir, input) =>
  path.join(destDir, input.substr(path.normalize(srcDir).length)) + '.js';

const svelteCompileAndWriteAll = (srcDir, destDir, inputs) =>
  Promise.all(
    inputs.map(input =>
      compileSvelteFile(input).then(compiled => {
        writeOutputFile(destPath(srcDir, destDir, input), compiled);
        return compiled;
      }),
    ),
  );

const transformAndRewriteAll = (srcDir, destDir, inputs, code) =>
  Promise.all(
    code.map((code, i) =>
      transform(code).then(transformed =>
        writeOutputFile(destPath(srcDir, destDir, inputs[i]), transformed),
      ),
    ),
  );

const writeOutputFile = (destPath, content) =>
  maybeLog('writeOutputFile', destPath) ||
  fs.promises
    .mkdir(path.dirname(destPath), {recursive: true})
    .then(() => fs.promises.writeFile(destPath, content));

module.exports.injectHydratorLoader = (input, props) =>
  injectIntoBody(`
    <script type="module">
      import Hydra from '${path.join('/', input)}.js';
        new Hydra({
          target: document.body,
          hydrate: true,
          props: ${JSON.stringify(props)}
        });
    </script>`);

// we need tmpdir because snowpack would fail to run after transformation
// (cannot find svelte/internal.js
module.exports.makeHydrators = (srcDir, tmpDir, destDir, inputs) =>
  maybeLog('makeHydrators', srcDir, tmpDir, destDir, inputs) ||
  (inputs ? Promise.resolve(inputs) : findSvelteFiles(srcDir)).then(inputs =>
    svelteCompileAndWriteAll(srcDir, tmpDir, inputs).then(compiled =>
      transformAndRewriteAll(tmpDir, destDir, inputs, compiled),
    ),
  );
