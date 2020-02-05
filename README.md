# svatic

Svelte and snowpack based static website generator with progressive enhancement.

Inspired by [svelvet](https://github.com/jakedeichert/svelvet).

This is currently at POC-level to see if it's feasable. Please raise an issue
if you have any questions/comments/complaints.


## But Why?
Now and then I have to build a mostly static website that does not need a fancy server.
It seems wrong to serve an empty html shell only to load a script that builds the DOM.

Existing generators are a bit too powerful/opinionated for those jobs.
* Sapper is great and I use it a lot. It can export static sites.
But it's a bit too powerful when I just need to build a simple website.
* Snowpack seems like a good idea - ditch the bundler and rely on current browsers
that support ESM. With svatic I get to show old browsers something and
progressively enhance in modern ones.
* I can't stand waiting for a bundler to finish.
* I just love svelte and would like to use it as a templating language.


## Goals
* Svelte-only. Not html wrappers needed.
* Fast!
* No crawling needed.
* As simple as possible, as flexible as necessary.


## Usage
watch and build take the same options.

watch will only rebuild changed files or files that depend on them.
It's **fast**!

### Basic
```js
const {watch, build} = require('svatic');

watch({
  pageMap: [
    {src: 'Index.svelte', dest: 'index.html'},
    {src: 'Privacy.svelte', dest: 'privacy.html', hydratable: true},
    {src: 'Contact.svelte', dest: 'imprint.html'},
  ],
}).then(() => console.log('done'))
```

### All options
```js
const dev = process.env.NODE_ENV !== 'production';
const srcDir = './src';
const tmpDir = './tmp';
const destDir = dev ? './out' : './dist';

const pageMap = [
  {src: 'Index.svelte', dest: 'index.html'},
  {src: 'Privacy.svelte', dest: 'privacy.html', hydratable: true},
  {src: 'Contact.svelte', dest: 'imprint.html'},
];

// Define some tasks needed for a full website
const dirs = () => sh('mkdir', ['-p', `${destDir}/fonts`, `${destDir}/img`]);
const installFonts = () =>
  sh('cp', ['-ruv', 'node_modules/typeface-inter/Inter (web)', `${destDir}/fonts`]);
const buildTailwind = () =>
  sh('npx', ['postcss', '-o', `${destDir}/tw.css`, 'src/css/tailwind.css']);
const images = () =>
  sh('cp', ['-ruv', 'src/img/*', `${destDir}/img/`], {shell: true});

watch({
  srcDir,  // (./src)  - pageMap.src is relative to this
  tmpDir,  // (./tmp)  - see [#6](https://github.com/PKlknr/svatic/issues/6)
  destDir, // (./dist) - write here
  pageMap, // don't want to dictate a structure. May accept function in the future

  // hooks: All hooks are run on start. When watching, hooks are run when
  // their filter returns true.
  hooks: [
    {task: dirs},
    {task: installFonts},
    {filter: filename => filename.endsWith('.css'), task: buildTailwind},
    {filter: filename => filename.includes('src/img'), task: images},
  ],
});
```

## How it works
### 1. Static: Generate static HTML from Svelte-components and inject style.

See [example/pureHtml](https://github.com/PKlknr/svatic/tree/master/example/pureHtml)

We include the whole html-document in a Svelte-component, so we don't need to crawl a site.

Note: This depends on https://github.com/sveltejs/svelte/pull/4309


### 2. Enhance: Build hydrators and inject a snippet to load them into the generated html

See [example/hydrate](https://github.com/PKlknr/svatic/tree/master/example/hydrate)

This is heavily inspired by what svelvet does.

### 3. Run snowpack to copy dependencies

### 4. Transform paths
turns .svelte into .svelte.js. Points at web_modules.


## Try it
```
# until https://github.com/sveltejs/svelte/pull/4309 and
# https://github.com/sveltejs/svelte/pull/4365 are merged:
git clone https://github.com/PKlknr/svelte
cd svelte
git checkout for-svatic
npm i && npm run build
cd ..

git clone https://github.com/PKlknr/svatic
cd svatic
npm i
npm i ../svelte

node example/pureHtml/build.js
node example/hydrate/build.js
```
... and have a look at example/*/out
