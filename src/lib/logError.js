/* eslint-disable no-console */

module.exports = e => {
  console.log(e);
  if (e.frame) {
    console.log(e.frame);
  }
  console.log('\n\nBuild failed\n\n');
};
