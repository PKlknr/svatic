const {makeHtmlWithStyle} = require('./src/makeHtml.js');
const {injectHydratorLoader, makeHydrators} = require('./src/hydrator');

module.exports = {
  makeHtmlWithStyle,
  injectHydratorLoader,
  makeHydrators,
};
