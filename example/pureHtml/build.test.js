const tap = require('tap');
const {build, io} = require('./build.js');
const fs = require('fs');

const cleanOut = () =>
  Promise.all(io.map(({dest}) => fs.promises.unlink(dest))).catch(err => {
    if (err.code !== 'ENOENT') {
      console.log('Cannot remove outfile', err);
      throw err;
    }
  });

tap.test('pureHtml example works', ({match, notMatch}) =>
  cleanOut()
    .then(build)
    .then(() => fs.promises.readFile(io[0].dest, 'utf-8'))
    .then(renderedHtml => {
      // console.log(renderedHtml)
      match(renderedHtml, /<footer/, 'contains footer');
      match(renderedHtml, /footer.svelte.*color:red/, 'contains footer style');
      notMatch(renderedHtml, /console.log/, 'no javascript passed through');
    }),
);
