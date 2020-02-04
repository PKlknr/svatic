const {
  makeHtmlWithStyle,
  injectHydratorLoader,
  makeHydrators,
} = require('../..');

const path = require('path');
const fs = require('fs');

const srcDir = path.join(__dirname, 'src');
const destDir = path.join(__dirname, 'out');

const io = [{src: 'Index.svelte', dest: 'index.html'}].map(x => ({
  src: path.join(srcDir, x.src),
  dest: path.join(destDir, x.dest),
}));

const props = {lang: 'en'};

const main = () =>
  fs.promises
    .mkdir(destDir, {recursive: true})
    .then(() =>
      Promise.all(
        io.map(({src, dest}) =>
          fs.promises.writeFile(
            dest,
            injectHydratorLoader(srcDir, src, props)(makeHtmlWithStyle(src, props)),
          ),
        ),
      ),
    )

    .then(() => makeHydrators(srcDir, destDir));

if (require.main === module) {
  main();
} else {
  module.exports = {build: main, io};
}
