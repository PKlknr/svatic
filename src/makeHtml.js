const {injectIntoHead, maybeLog} = require('./lib');
const relative = require('require-relative');
const path = require('path');

require('svelte/register')({
  dev: true,
});

// require look inside node_modules when path does not start with / or ./
const requireablePath = p => (!path.isAbsolute(p) ? './' : '') + p;

const renderHtml = (srcDir, filename, props) => {
  const mod = relative.resolve(
    requireablePath(path.join(srcDir, filename)),
    process.cwd(),
  );
  /* eslint-disable-next-line global-require */
  const Comp = relative(mod).default;

  return Comp.render(props);
};

module.exports.makeHtmlWithStyle = (srcDir, filename, props) => {
  maybeLog('makeHtmlWithStyle', srcDir, filename, props);
  const rendered = renderHtml(srcDir, filename, props);
  return injectIntoHead(`\n<style>${rendered.css.code}</style>\n`)(
    rendered.html,
  );
};
