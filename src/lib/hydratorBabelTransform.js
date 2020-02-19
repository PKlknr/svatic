// mostly borrowed from https://github.com/jakedeichert/svelvet
const babel = require('@babel/core');
const path = require('path');
const fs = require('fs');
const glob = require('glob');

// update imports to point at
// * .svelte.js insted of .svelte
// * web_modules by snowpack
const babelConfig = destDir => ({
  plugins: [
    () => ({
      visitor: {
        ImportDeclaration: path => {
          path.node.source.value = path.node.source.value.replace(
            /\.svelte(?!\.)/,
            '.svelte.js',
          );
        },
      },
    }),
    [
      path.resolve(require.resolve('snowpack'), '../../assets/babel-plugin.js'),
      {
        // Append .js to all src file imports
        optionalExtensions: true,
        importMap: path.join(
          '..',
          path.relative('', destDir),
          '/web_modules/import-map.json',
        ),
      },
    ],
  ].filter(x => x),
});

const transform = (destDir, code) =>
  babel.transformAsync(code, babelConfig(destDir)).then(r => r.code);

const findSvelteJsFiles = async dir =>
  glob
    .sync(dir + '/**/!(*+(spec|test)).+(svelte.js)', {nodir: true})
    .map(x => path.normalize(x));

module.exports.transformFiles = (destDir, onlyFiles) =>
  (onlyFiles ? Promise.resolve(onlyFiles) : findSvelteJsFiles(destDir)).then(
    files =>
      Promise.all(
        files.map(file =>
          fs.promises
            .readFile(file)
            .then(code => transform(destDir, code))
            .then(transformed => fs.promises.writeFile(file, transformed)),
        ),
      ),
  );
