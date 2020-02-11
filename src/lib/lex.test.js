const tap = require('tap');
const {buildImportMap} = require('./lex');
const {
  build,
  pageMap,
  destDir,
} = require('../../example/build.pureHtml');


tap.test('buildImportMap()', async ({deepEqual}) => {
  await build();
  const m = await buildImportMap(
    destDir,
    pageMap.map(({src}) => src),
  );

  deepEqual(
    m.map(([name]) => name),
    ['Index.svelte', 'About.svelte'],
    'has maps for Index.svelte and About.svelte',
  );

  deepEqual(
    [...m[0][1]],
    ['/web_modules/svelte/internal.js', 'Page.svelte.js', 'Foot.svelte.js'],
    'Index has Page, Foot, svelte/internal',
  );

  deepEqual(
    [...m[1][1]],
    [
      '/web_modules/svelte/internal.js',
      'Page.svelte.js',
      '/web_modules/svelte/transition.js',
      'Foot.svelte.js',
    ],
    'About has additional svelte/transition',
  );
});
