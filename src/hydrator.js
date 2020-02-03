const {injectIntoBody} = require('./lib');
const {snowpack, maybeLog} = require('./lib');
const fs = require('fs');
const path = require('path');

const glob = require('glob');
const findSvelteFiles = async srcDir =>
  glob.sync(srcDir + '/**/!(*+(spec|test)).+(svelte)', {nodir: true});

const transform = require('./lib/hydratorBabelTransform');
const compileSvelteFile = require('./lib/compileSvelte');

module.exports.injectHydratorLoader = (srcDir, input) =>
  injectIntoBody(`
    <script type="module">
      import Hydra from '${destPath(srcDir, '', input)}';
        new Hydra({
          target: document,
          hydrate: true
        });
    </script>`);

const destPath = (srcDir, destDir, input) =>
  destDir + input.substr(srcDir.length) + '.js';

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

const runSnowpack = destDir =>
  snowpack({
    include: path.join(destDir + '/**/*'),
    dest: path.join(destDir, 'web_modules'),
  });

const transformAndRewriteAll = (srcDir, destDir, inputs, code) =>
  Promise.all(
    code.map((code, i) =>
      transform(code).then(
        transformed =>
          maybeLog('Writing hydrator', inputs[i], transformed) ||
          writeOutputFile(destPath(srcDir, destDir, inputs[i]), transformed),
      ),
    ),
  );

module.exports.makeHydrators = (srcDir, destDir) =>
  // This compiles every Svelte-component.
  // TODO: Find a way to only compile those actually needed.
  // Maybe the rollup-step from makeHtml can tell us.
  findSvelteFiles(srcDir).then(inputs =>
    svelteCompileAndWriteAll(srcDir, destDir, inputs).then(compiled =>
      runSnowpack(destDir).then(() =>
        transformAndRewriteAll(srcDir, destDir, inputs, compiled),
      ),
    ),
  );

const writeOutputFile = (destPath, content) =>
  fs.promises
    .mkdir(path.dirname(destPath), {recursive: true})
    .then(() => fs.promises.writeFile(destPath, content));
