# svatic

Fast static website generator with progressive enhancement - based on [Svelte](https://svelte.dev) and [Snowpack](https://www.snowpack.dev/), inspired by [svelvet](https://github.com/jakedeichert/svelvet).

![image](https://user-images.githubusercontent.com/60601481/74074458-70c24980-4a0e-11ea-8e50-73d86a77146f.png)


## But Why?
Now and then I have to build a mostly static website that does not need a fancy server.
It seems wrong to serve an empty html shell only to load a script that builds the DOM.

Existing generators are a bit too powerful/opinionated for my taste.
* Sapper is great and I use it a lot. It can export static sites.
But it's too much when I just need to build a simple website and not an app.
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

### cli
A very simple cli renders `.svelte` files in `src` to hydratable `.html` and copies
other files.
```
npm i --save-dev PKlknr/svatic
npx svatic
```

Now, when you create e.g. `src/Index.svelte`, it will create `dest/index.html` and 
serve it wit live-reloading.


### lib
`watch` and `build` take the same options. `serve` takes additional `servorOptions`.

watch will only rebuild changed files and files that depend on them.
It's **fast**!

#### Basic
```js
const {watch, build, serve} = require('svatic');

serve({
  pageMap: [
    {src: 'Index.svelte', dest: 'index.html'},
    {src: 'Privacy.svelte', dest: 'privacy.html', hydratable: true},
    {src: 'Contact.svelte', dest: 'imprint.html'},
  ],
}).then(() => console.log('done'))
```

#### All options
```js
const dev = process.env.NODE_ENV !== 'production';
const srcDir = './src';
const destDir = dev ? './out' : './dist';

const pageMap = [
  {src: 'Index.svelte', dest: 'index.html'},
  // hydratable tells build to hydrate the page
  {src: 'Privacy.svelte', dest: 'privacy.html', hydratable: true,},
  // props are passed to the root component
  {src: 'Contact.svelte', dest: 'imprint.html' props: {lang: 'en'}},
];

// Define some tasks needed for a full website
const dirs = () => ...
...

serve({
  srcDir,  // (./src)  - pageMap[].src is relative to this
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

  afterBuild, // (noop) - function that is called after each build. First
              // param is error if apllicable

  // servorOptions are passed to servor
  servorOptions: {port: 3000},
});
```

## How it works
See [example/src](https://github.com/PKlknr/svatic/tree/master/example/src)

### 1. Static: Generate static HTML from Svelte-components and inject style.

We include the whole html-document in a Svelte-component, so we don't need to crawl a site.

Note: This depends on https://github.com/sveltejs/svelte/pull/4309

### 2. Enhance: Build hydrators and inject a snippet to load them into the generated html

This is heavily inspired by what svelvet does.

### 3. Run snowpack to copy dependencies

### 4. Transform paths
Turns .svelte into .svelte.js. Points at web_modules.

### 5. Watch
Build a map of dependencies for each page. On change, rebuild the changed file and all files depending on it.

## Try it
```
git clone https://github.com/PKlknr/svatic
cd svatic
npm i

node example/build.pureHtml.js
node example/build.hydrate.js
```
... and have a look at example/*/out
