const fs = require('fs');
const path = require('path');

module.exports = (destPath, content) =>
  console.log(
    'writeOutputFile',
    destPath,
    path.dirname(destPath),
    content.length,
    'bytes',
  ) ||
  Promise.resolve()
    // TODO optimize
    .then(() => fs.promises.mkdir(path.dirname(destPath), {recursive: true}))
    .then(() => fs.promises.writeFile(destPath, content));
