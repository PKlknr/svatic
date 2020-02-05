const {
  makeHtmlWithStyle,
  injectHydratorLoader,
  makeHydrators,
  runSnowpack,
} = require('../..');

const path = require('path');
const fs = require('fs');

const pageMap = [{src: 'Index.svelte', dest: 'index.html'}];

const srcDir = path.join(__dirname, 'src');
const tmpDir = path.join(__dirname, 'tmp');
const destDir = path.join(__dirname, 'out');

const props = {lang: 'en'};

const main = () =>
  fs.promises
    .mkdir(destDir, {recursive: true})
    .then(() =>
      Promise.all(
        pageMap.map(({src, dest}) =>
          fs.promises.writeFile(
            path.join(destDir, dest),
            injectHydratorLoader(
              srcDir,
              src,
              props,
            )(makeHtmlWithStyle(srcDir, src, props)),
          ),
        ),
      ),
    )

    .then(() => makeHydrators(srcDir, tmpDir, destDir))
    .then(() => runSnowpack(tmpDir, destDir))
;

if (require.main === module) {
  main();
} else {
  module.exports = {build: main, pageMap, srcDir, destDir};
}
