const {injectIntoHead} = require('.');
const relative = require('require-relative');
const path = require('path');
const {rollup} = require('rollup');
const rollupSveltePlugin = require('rollup-plugin-svelte');
// for renderSvelteRollup
// eslint-disable-next-line no-unused-vars
const internal = require('svelte/internal');

require('svelte/register')({
  dev: process.NODE_ENV === 'production',
});

// require look inside node_modules when path does not start with / or ./
const requireablePath = p => (!path.isAbsolute(p) ? './' : '') + p;


const renderSvelteRequire = (srcDir, filename, props) => {
  const mod = relative.resolve(
    requireablePath(path.join(srcDir, filename)),
    process.cwd(),
  );
  /* eslint-disable-next-line global-require */
  return relative(mod).default.render(props);
};


const renderSvelteRollup = (srcDir, filename, props) =>
  rollup({
    input: (path.join(srcDir, filename)),
    plugins: [
      rollupSveltePlugin({
        generate: 'ssr',
        hydratable: true,
      }),
    ],
    external: ['svelte/internal'],
  }).then(bundle =>
    bundle.generate({
      format: 'cjs',
    }),
  ).then(gen =>{
    // eslint-disable-next-line no-eval
    const r = eval(gen.output[0].code).render(props)
    return r 
  }

  );


const RENDERER = renderSvelteRequire;


const renderSvelteWithStyle = async (srcDir, filename, props) => {
  const rendered = await RENDERER(srcDir, filename, props);
  return injectIntoHead(`\n<style>${rendered.css.code}</style>\n`)(
    rendered.html,
  );
}

module.exports.renderSvelteWithStyle = renderSvelteWithStyle;
