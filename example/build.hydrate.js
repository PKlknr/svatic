const {build} = require('..');
const {srcDir, pageMap} = require('./build.pureHtml');
const path = require('path');

const destDir = path.join(__dirname, 'out/hydrate');

const main = () =>
  build({
    srcDir,
    destDir,
    pageMap: pageMap.map(x => ({
      ...x,
      hydratable: true,
      props: {lang: 'en'},
    })),
  });

if (require.main === module) {
  main();
} else {
  module.exports = {build: main, pageMap, srcDir, destDir};
}
