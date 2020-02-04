const {makeHtmlWithStyle} = require('../..');

const path = require('path');
const fs = require('fs');

const io = [
  {src: 'Index.svelte', dest: 'index.html'},
  {src: 'About.svelte', dest: 'about.html'},
].map(x => ({
  src: path.join(__dirname, 'src', x.src),
  dest: path.join(__dirname, 'out', x.dest),
}));

const main = () =>
  fs.promises
    .mkdir(path.join(__dirname, 'out'), {recursive: true})

    .then(() =>
      Promise.all(
        makeHtmlWithStyle(io.map(({src}) => src)).map((html, i) =>
          fs.promises.writeFile(io[i].dest, html),
        ),
      ),
    );

if (require.main === module) {
  main();
} else {
  module.exports = {build: main, io};
}
