const fs = require('fs');
const path = require('path');
const {compile} = require('svelte/compiler');
const svelte = require('svelte/compiler');

const extensions = ['.svelte', '.html'];
let compileOptions = {};

function capitalise(name) {
  return name[0].toUpperCase() + name.slice(1);
}

function register(options = {}) {
  if (options.extensions) {
    extensions.forEach(deregisterExtension);
    options.extensions.forEach(registerExtension);
  }

  compileOptions = Object.assign({}, options);
  delete compileOptions.extensions;
}

function deregisterExtension(extension) {
  delete require.extensions[extension];
}

function registerExtension(extension) {
  require.extensions[extension] = function(module, filename) {
    const name = path
      .parse(filename)
      .name.replace(/^\d/, '_$&')
      .replace(/[^a-zA-Z0-9_$]/g, '');

    const options = Object.assign({}, compileOptions, {
      filename,
      name: capitalise(name),
      generate: 'ssr',
      format: 'cjs',
    });

    let src = fs.readFileSync(filename, 'utf-8');
    let code

    if (options.preproc) {
      code = svelte
        .preprocess(
          src,
          {
            markup: ({content, filename}) => ({
              code: content.replace(/foo/g, 'bar'),
            }),
          },
          {
            filename: 'App.svelte',
          },
        )
        .then(x => console.log('PROCD', x));
      delete options.preproc;
      src = code;
      console.log(code);
    }

    return {default: code.then(src => {
      const {js, warnings} = compile(src, options);

      if (options.dev) {
        warnings.forEach(warning => {
          console.warn(`\nSvelte Warning in ${warning.filename}:`);
          console.warn(warning.message);
          console.warn(warning.frame);
        });
      }

      console.log('...........',js.code)
      return module._compile(js.code, filename);
    })};
  };
}

registerExtension('.svelte');
registerExtension('.html');

module.exports = register;
