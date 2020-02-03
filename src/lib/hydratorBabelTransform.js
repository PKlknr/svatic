// mostly borrowed from https://github.com/jakedeichert/svelvet
const babel = require('@babel/core');

// update imports to point at
// * .svelte.js insted of .svelte
// * web_modules by snowpack
const babelConfig = {
  plugins: [
    () => ({
      visitor: {
        ImportDeclaration: path => {
          path.node.source.value = path.node.source.value.replace(
            /\.svelte/,
            '.svelte.js',
          );
        },
      },
    }),
    'snowpack/assets/babel-plugin.js',
  ],
};

module.exports = code =>
  babel.transformAsync(code, babelConfig).then(r => r.code);
