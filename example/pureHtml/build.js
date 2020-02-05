const {makeHtmlWithStyle} = require('../..');

const path = require('path');
const fs = require('fs');

const pageMap = [
  {src: 'Index.svelte', dest: 'index.html'},
  {src: 'About.svelte', dest: 'about.html'},
];

const srcDir = path.join(__dirname, 'src');
const destDir = path.join(__dirname, 'out');

const main = () =>
  fs.promises
    .mkdir(destDir, {recursive: true})

    .then(() =>
      Promise.all(
        pageMap.map(({src, dest}) =>
          fs.promises.writeFile(
            path.join(destDir, dest),
            makeHtmlWithStyle(srcDir, src),
          ),
        ),
      ),
    );

if (require.main === module) {
  main();
} else {
  module.exports = {build: main, pageMap, srcDir, destDir};
}
