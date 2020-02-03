const {rollup} = require('rollup');
const rollupSveltePlugin = require('rollup-plugin-svelte');
const {injectIntoHead, maybeLog} = require('./lib');

// for renderSSR
// eslint-disable-next-line no-unused-vars
const internal = require('svelte/internal');

const rollupGenerate = input =>
  maybeLog('rollupGenerate', input) ||
  rollup({
    input,
    plugins: [
      rollupSveltePlugin({
        generate: 'ssr',
        hydratable: true,
      }),
    ],
    external: ['svelte/internal'],
  })
    // .then(r => console.log(JSON.stringify(r, 2, '  ')) || r)
    .then(bundle =>
      bundle.generate({
        format: 'cjs',
      }),
    );

const renderSSR = code => {
  // eslint-disable-next-line no-eval
  const evaled = eval(code);
  return evaled.render();
};

// When rolling multiple inputs, common modules get chunked. That breaks the
// simple eval in renderSSR.
//
// chunking cannot be disabled yet:
// https://github.com/rollup/rollup/issues/2756
//
// TODO: find out if it's faster to generate files and require them (insted of eval)
const RollupGenerateSeparately = inputs =>
  Promise.all(inputs.map(x => rollupGenerate(x).then(x => x.output[0])));

const makeHtml = inputs =>
  RollupGenerateSeparately(inputs).then(outputs =>
    outputs.map(
      (out, i) => maybeLog('rendering', inputs[i]) || renderSSR(out.code),
    ),
  );

module.exports.makeHtmlWithStyle = inputs =>
  makeHtml(inputs).then(r =>
    r.map(rendered =>
      injectIntoHead(`\n<style>${rendered.css.code}</style>\n`)(rendered.html),
    ),
  );
