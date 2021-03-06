// borrowed from https://github.com/jakedeichert/svelvet
// TODO: Would be nice if we could find a non-cli-api to snowpack

const util = require('util');
const childProcess = require('child_process');
const exec = util.promisify(childProcess.exec);
const path = require('path');
const glob = require('glob');
const maybeLog = require('./maybeLog');

const snowpackLocation = path.resolve(
  require.resolve('snowpack'),
  '../index.bin.js',
);

module.exports = ({
  optimize = false,
  include = 'out/**/*',
  dest = 'out/web_modules',
} = {}) => {
  // TODO: optimize
  // We need this glob so we dont crash when there are no files in tmp yet
  if (glob.sync(include, {nodir: true}).length) {
    return exec(
      `${snowpackLocation} --include '${include}' --dest ${dest} ${
        0 && optimize ? '--optimize' : ''
      }`,
    ).then(({stdout, stderr}) => {
      if (stdout) {
        maybeLog(stdout);
      }
      if (stderr) {
        /* eslint-disable-next-line no-console */
        console.log(stderr);
      }
    });
  } else {
    return Promise.resolve();
  }
};
