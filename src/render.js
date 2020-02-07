const fs = require('fs');
const path = require('path');
const {maybeLog} = require('./lib');
const {renderSvelteWithStyle} = require('./lib/renderSvelte');
const {injectHydratorLoader} = require('./hydrator');

const renderPage = (srcDir, destDir, src, dest, hydratable, props) =>
  renderSvelteWithStyle(srcDir, src)
    .then(html => (hydratable ? injectHydratorLoader(src, props)(html) : html))
    .then(
      html =>
        maybeLog('renderPage writes', path.join(destDir, dest)) ||
        fs.promises.writeFile(path.join(destDir, dest), html),
    );

module.exports.renderPage = renderPage;
