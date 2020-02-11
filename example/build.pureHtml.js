const {build} = require('..');

const path = require('path');

const pageMap = [
  {src: 'Index.svelte', dest: 'index.html'},
  {src: 'About.svelte', dest: 'about.html'},
];

const srcDir = path.join(__dirname, 'src');
const tmpDir = path.join(__dirname, 'tmp');
const destDir = path.join(__dirname, 'out/pureHtml');

const main = () =>
  build({
    srcDir,
    tmpDir,
    destDir,
    pageMap,
  });

if (require.main === module) {
  main();
} else {
  module.exports = {build: main, pageMap, srcDir, tmpDir, destDir};
}
