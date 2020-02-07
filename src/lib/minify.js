const fs = require('fs');
const terser = require('terser');
const writeOutputFile = require('./writeOutputFile');

module.exports = filename =>
  fs.promises
    .readFile(filename, 'utf8')
    .then(source =>
      terser.minify(source, {
        module: true,
      }),
    )
    .then(result => writeOutputFile(filename, result.code))
    .then(() => console.info(`Terser minified ${filename}`));
