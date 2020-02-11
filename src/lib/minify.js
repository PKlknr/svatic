const fs = require('fs');
const terser = require('terser');
const writeOutputFile = require('./writeOutputFile');
const maybeLog = require('./maybeLog');

module.exports = filename =>
  fs.promises
    .readFile(filename, 'utf8')
    .then(source =>
      terser.minify(source, {
        module: true,
      }),
    )
    .then(result => writeOutputFile(filename, result.code))
    .then(() => maybeLog(`Terser minified ${filename}`));
