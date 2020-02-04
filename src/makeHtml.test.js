const tap = require('tap');
const {makeHtmlWithStyle} = require('./makeHtml');

tap.test('makeHtmlWithStyle()', async ({equal, match}) => {
  const r = makeHtmlWithStyle('./test/Test.svelte');

  equal(typeof r, 'string', 'result is string');
  match(r, /Hello world/, '.. variable substituted');
  match(r, /style.*\.bold\.svelte/, '.. css injected into html');
});
