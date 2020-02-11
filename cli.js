#!/usr/bin/env node

const {serve} = require('./src/serve');
const glob = require('glob');
const path = require('path');

const srcDir = './src';
const tmpDir = './tmp';
const destDir = './dest';

const findPages = () => glob
  .sync(path.normalize(srcDir) + '/*.svelte', {
    nodir: true,
  })
  .map(x => path.basename(x))
  .map(path.normalize);

const findAssets = () =>
  glob
    .sync(srcDir + '/**/*', {nodir: true})
    .filter(x => !x.endsWith('.svelte'))
    .map(path.normalize);

const pageMap = () => {
  const r = findPages().map(sv => ({
    src: sv,
    dest: sv.toLowerCase().replace(/\.svelte$/, '.html'),
    hydratable: true,
  }));

  return r;
};

const fs = require('fs');

const copyFile = filename => {
  const destPath = filename.replace(new RegExp('^src/'), 'dist/');
  console.log('copying asset', filename, destPath, path.dirname(destPath));
  return fs.promises
    .mkdir(path.dirname(destPath), {recursive: true})
    .then(() => fs.promises.copyFile(filename, destPath));
};

const copyAllFiles = () => Promise.all(findAssets().map(x => copyFile(x)));

serve({
  srcDir,
  tmpDir,
  destDir,
  pageMap,
  hooks: [
    {
      filter: filename => !filename.endsWith('.svelte'),
      task: filename => {
        if (filename) {
          return copyFile(filename);
        } else {
          return copyAllFiles();
        }
      },
    },
  ],
});
