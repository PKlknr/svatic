const fs = require('fs');
const svelte = require('svelte/compiler');

const compileSvelte = (srcPath, source) => {
  const result = svelte.compile(source, {
    filename: srcPath,
    dev: process.env.NODE_ENV !== 'production',
    hydratable: true,
  });

  result.warnings.forEach(warning => {
    /* eslint-disable no-console */
    console.warn(`\nWarning: ${warning.filename}\n${warning.message}`);
    console.warn(warning.frame);
  });

  return result.js.code;
};

module.exports = input =>
  fs.promises.readFile(input, 'utf-8').then(src => compileSvelte(input, src));
