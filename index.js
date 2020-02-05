const {makeHtmlWithStyle} = require('./src/makeHtml.js');
const {watch, build} = require('./src/watch');
const {
  injectHydratorLoader,
  makeHydrators,
  runSnowpack,
} = require('./src/hydrator');

module.exports = {
  makeHtmlWithStyle,
  injectHydratorLoader,
  makeHydrators,
  runSnowpack,
  watch,
  build,
};
