/*eslint-disable no-console */

module.exports = process.argv.includes('--quiet')
  ? () => {}
  : (...args) => console.log(...args);
