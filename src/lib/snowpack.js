// borrowed from https://github.com/jakedeichert/svelvet
// TODO: Would be nice if we could find a non-cli-api to snowpack

const util = require('util');
const childProcess = require('child_process');
const exec = util.promisify(childProcess.exec);
const path = require('path');

const snowpackLocation = path.resolve(
  require.resolve('snowpack'),
  '../index.bin.js',
);

module.exports = ({
  optimize = false,
  include = 'out/**/*',
  dest = 'out/web_modules',

} = {}) =>
  exec(
    `${snowpackLocation} --include '${include}' --dest ${dest} ${
      optimize ? '--optimize' : ''
    }`,
  ).then(({stdout, stderr}) => {
    if (stdout) {
      console.log(stdout);
    }
    if (stderr) {
      console.log(stderr);
    }
  });
