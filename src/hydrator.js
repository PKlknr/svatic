const writeOutputFile = require('./lib/writeOutputFile');
const {injectIntoBody} = require('./lib');
const path = require('path');

const glob = require('glob');

const findSvelteFiles = async srcDir =>
  glob
    .sync(srcDir + '/**/!(*+(spec|test)).+(svelte)', {nodir: true})
    .map(x => path.normalize(x));

const compileSvelteFile = require('./lib/compileSvelte');

const destPath = (srcDir, destDir, input) =>
  path.join(destDir, input.substr(path.normalize(srcDir).length)) + '.js';

const svelteCompileAndWriteAll = (srcDir, destDir, inputs) =>
  Promise.all(
    inputs.map(input =>
      compileSvelteFile(input).then(compiled =>
        writeOutputFile(destPath(srcDir, destDir, input), compiled).then(
          () => compiled,
        ),
      ),
    ),
  );

module.exports.injectHydratorLoader = (input, props) =>
  injectIntoBody(`
    <script type="module">
      import Hydra from '${path.join('/', input)}.js';
      const styles = document.getElementById('style-svatic');
      new Hydra({
        target: document,
        hydrate: true,
        props: ${JSON.stringify(props)}
      });
      document.head.appendChild(styles);
    </script>`);

module.exports.makeHydrators = (srcDir, destDir, inputs) =>
  (inputs ? Promise.resolve(inputs) : findSvelteFiles(srcDir)).then(inputs =>
    svelteCompileAndWriteAll(srcDir, destDir, inputs),
  );
