const tap = require('tap');
const {build, destDir} = require('./build.js');
const fs = require('fs');
const glob = require('glob');
const path = require('path');

const findOutputFiles = () => glob.sync(destDir + '/**/*', {nodir: true});

const cleanOut = () =>
  Promise.all(findOutputFiles().map(fs.promises.unlink)).catch(err => {
    console.log('Cannot remove outfile', err);
    throw err;
  });

const expectedOutFiles = [
  '/index.html',
  '/Index.svelte.js',
  '/web_modules/import-map.json',
  '/web_modules/svelte/internal.js',
].map(x => path.join(__dirname, 'out', x));

tap.test('hydrator example works', ({deepEqual, match}) =>
  cleanOut()
    .then(build)
    .then(() => {
      deepEqual(
        findOutputFiles(),
        expectedOutFiles,
        'expected output files found',
      );
    })

    .then(() =>
      fs.promises
        .readFile(path.join(__dirname, '/out/index.html'), 'utf-8')
        .then(r => {
          match(
            r,
            'import Hydra from \'/Index.svelte.js',
            'index.html: hydrator is imported',
          );

          match(r, /props:.*lang.*en/, 'props appear in index.html');
        }),
    )

    .then(() =>
      fs.promises
        .readFile(path.join(__dirname, '/out/Index.svelte.js'), 'utf-8')
        .then(r => {
          match(r, 'dispatch_dev', 'Index.svelte.js: in dev-mode');
          match(
            r,
            'from "/web_modules/svelte/internal.js"',
            'Index.svelte.js: svelte/internal import correctly transformed',
          );
        }),
    ),
);

tap.test('hydrator:production', ({deepEqual, match, notMatch}) =>
  cleanOut()
    .then(() => {
      process.env.NODE_ENV = 'production';
      return build().then(() => {
        process.env.NODE_ENV = '';
      });
    })
    .then(() => {
      deepEqual(
        findOutputFiles(),
        [
          ...expectedOutFiles,
          '/home/pk/git/svatic/example/hydrate/out/web_modules/svelte/internal.js.map',
        ],
        'expected output files found',
      );
    })

    .then(() =>
      fs.promises
        .readFile(path.join(__dirname, '/out/Index.svelte.js'), 'utf-8')
        .then(r => {
          match(
            r,
            'from"/web_modules/svelte/internal.js"',
            'Index.svelte.js: svelte/internal import correctly minified',
          );
          notMatch(r, 'dispatch_dev', 'Index.svelte.js: not in dev-mode');
        }),
    ),
);
