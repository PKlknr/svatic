const fs = require('fs');
const terser = require('terser');

module.exports = filename =>
  fs.promises
    .readFile(filename, 'utf8')
    .then(source =>
      terser.minify(source, {
        module: true,
      }),
    )
    .then(result => fs.promises.writeFile(filename, result.code))
    .then(() => console.info(`Terser minified ${filename}`));
