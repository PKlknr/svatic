const path = require('path');
const {renderSvelteWithStyle} = require('./lib/renderSvelte');
const {injectHydratorLoader} = require('./hydrator');
const writeOutputFile = require('./lib/writeOutputFile');

const renderPage = (srcDir, destDir, src, dest, hydratable, props) =>
  renderSvelteWithStyle(srcDir, src)
    .then(html => (hydratable ? injectHydratorLoader(src, props)(html) : html))
    .then(html => writeOutputFile(path.join(destDir, dest), html));

module.exports.renderPage = renderPage;
