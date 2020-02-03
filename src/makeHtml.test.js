const tap = require('tap');
const {makeHtmlWithStyle} = require('./makeHtml');

tap.test('makeHtmlWithStyle()', async ({equal, match}) =>
  makeHtmlWithStyle(['./test/Test.svelte']).then(r => {
    equal(r.length, 1, 'result has 1 element');
    match(r[0], /Hello world/, '.. variable substituted');
    match(
      r[0],
      /style.*\.bold\.svelte/,
      '.. css injected into html',
    );
  }),
);
