const {watch} = require('./src/watch');
const {build} = require('./src/build');
const {
  injectHydratorLoader,
  makeHydrators,
  runSnowpack,
} = require('./src/hydrator');

module.exports = {
  watch,
  build,
};
