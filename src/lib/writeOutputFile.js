const fs = require('fs');
const path = require('path');
const maybeLog = require('./maybeLog');

module.exports = (destPath, content) =>
  maybeLog(
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
