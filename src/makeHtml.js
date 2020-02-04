const {injectIntoHead} = require('./lib');
const relative = require('require-relative');

require('svelte/register')({
  dev: true,
});

const renderHtml = (input, props) => {
  /* eslint-disable-next-line global-require */
  const Comp = relative(input, process.cwd()).default;
  return Comp.render(props);
};

module.exports.makeHtmlWithStyle = (filename, props) => {
  const rendered = renderHtml(filename, props);
  return injectIntoHead(`\n<style>${rendered.css.code}</style>\n`)(
    rendered.html,
  );
};
