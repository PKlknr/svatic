const fs = require('fs');
const path = require('path');
const {maybeLog} = require('./lib');
const {renderSvelteWithStyle} = require('./lib/renderSvelte');
const {injectHydratorLoader} = require('./hydrator');


const renderPage = (srcDir, destDir, src, dest, hydratable, props) => {
  const html = renderSvelteWithStyle(srcDir, src);
  const h2 = hydratable ? injectHydratorLoader(src, props)(html) : html;
  maybeLog('renderPage writes', path.join(destDir, dest));
  return fs.promises.writeFile(path.join(destDir, dest), h2);
};

module.exports.renderPage = renderPage;
