const {injectIntoHead} = require('./lib');
const relative = require('require-relative');

require('svelte/register');

const renderHtml = input => {
  /* eslint-disable-next-line global-require */
  const Comp = relative(input, process.cwd()).default;
  return Comp.render();
};

module.exports.makeHtmlWithStyle = inputs =>
  inputs
    .map(renderHtml)
    .map(rendered =>
      injectIntoHead(`\n<style>${rendered.css.code}</style>\n`)(rendered.html),
    );
