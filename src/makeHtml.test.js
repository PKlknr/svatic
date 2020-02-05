const tap = require('tap');
const {makeHtmlWithStyle} = require('./makeHtml');

tap.test('makeHtmlWithStyle()', async ({equal, match}) => {
  const r = makeHtmlWithStyle('test', 'Test.svelte');

  equal(typeof r, 'string', 'result is string');
  match(r, /Hello world/, '.. variable substituted');
  match(r, '<html>', 'undefined attribute "lang" on html tag removed');
  match(r, /style.*\.bold\.svelte/, '.. css injected into html');
});

tap.test('makeHtmlWithStyle() with props', async ({match}) => {
  const r = makeHtmlWithStyle('test', 'Test.svelte', {lang: 'en'});

  match(r, /Hello world/, '.. variable substituted');
  match(r, '<html lang="en">', 'prop propagated to html tag');
});
