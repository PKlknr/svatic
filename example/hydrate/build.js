const {build} = require('../..');

const path = require('path');
const fs = require('fs');

const pageMap = [
  {
    src: 'Index.svelte',
    dest: 'index.html',
    hydratable: true,
    props: {lang: 'en'},
  },
];

const srcDir = path.join(__dirname, 'src');
const tmpDir = path.join(__dirname, 'tmp');
const destDir = path.join(__dirname, 'out');

const main = () =>
  fs.promises
    .mkdir(destDir, {recursive: true})
    .then(() => build({srcDir, tmpDir, destDir, pageMap}));

if (require.main === module) {
  main();
} else {
  module.exports = {build: main, pageMap, srcDir, destDir};
}
