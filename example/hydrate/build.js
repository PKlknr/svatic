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

const main = () =>
  fs.promises
    .mkdir(destDir, {recursive: true})
    .then(() => makeHtmlWithStyle(io.map(({src}) => src)))
    .then(r => r.map((html, i) => injectHydratorLoader(srcDir, io[i].src)(html)))
    .then(r =>
      Promise.all(r.map((html, i) => fs.promises.writeFile(io[i].dest, html))),
    )

    .then(() => makeHydrators(srcDir, destDir));

if (require.main === module) {
  main();
} else {
  module.exports = {build: main, io};
}
