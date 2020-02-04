const {injectIntoHead} = require('./lib');
const relative = require('require-relative');

require('svelte/register')({
  dev: true,
});

const renderHtml = filename => {
  /* eslint-disable-next-line global-require */
  const Comp = relative(filename, process.cwd()).default;
  return Comp.render();
};

module.exports.makeHtmlWithStyle = filename => {
  const rendered = renderHtml(filename);
  return injectIntoHead(`\n<style>${rendered.css.code}</style>\n`)(
    rendered.html,
  );
  return rendered;
};
