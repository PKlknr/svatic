const {injectIntoHead} = require('.');
const path = require('path');
const {rollup} = require('rollup');
const rollupSveltePlugin = require('rollup-plugin-svelte');
const resolve = require('@rollup/plugin-node-resolve');

const renderSvelteRollup = (srcDir, destDir, filename, props) =>
  rollup({
    input: path.join(srcDir, filename),
    plugins: [
      rollupSveltePlugin({
        generate: 'ssr',
        hydratable: true,
        dev: process.NODE_ENV !== 'production',
      }),
      resolve(),
    ],
    external: [],
  })
    .then(bundle =>
      bundle.generate({
        format: 'cjs',
      }),
    )
    .then(gen => {
      try {
        // eslint-disable-next-line no-eval
        const r = eval(gen.output[0].code).render(props);
        return r;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(
          gen.output[0].code
            .split('\n')
            .map((x, i) => String(i + 1) + ' | ' + x)
            .join('\n'),
        );
        throw e;
      }
    });

const renderSvelteWithStyle = async (srcDir, destDir, filename, props) => {
  const rendered = await renderSvelteRollup(srcDir, destDir, filename, props);
  return (
    '<!DOCTYPE html>' +
    injectIntoHead(`\n<style id="style-svatic">${rendered.css.code}</style>\n`)(
      rendered.html,
    )
  );
};

module.exports.renderSvelteWithStyle = renderSvelteWithStyle;
