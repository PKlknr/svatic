# svatic

Svelte-based static website generator with progressive enhancement.

Inspired by [svelvet](https://github.com/jakedeichert/svelvet).

This is currently at POC-level to see if it's feasable. Please raise an issue
if you have any questions/comments/complaints.


## How it works
### 1. Static: Generate static HTML from Svelte-components and inject style.

See [example/purHtml](https://github.com/PKlknr/svatic/tree/master/example/pureHtml)

We include the whole html-document in a Svelte-component,
so we don't need to crawl a site. Uses rollup-plugin-svelte to generate
html intended for SSR.

Note: This depends on https://github.com/sveltejs/svelte/pull/4309


### 2. Enhance: Build hydrators and inject a snippet to load them into the generated html

See [example/hydrate](https://github.com/PKlknr/svatic/tree/master/example/hydrate)

This is heavily inspired by what svelvet does: Compile all .svelte-files,
run snowpack, transform import paths.


## Try it
```
# until https://github.com/sveltejs/svelte/pull/4309 is merged:
git clone https://github.com/avi/svelte
cd svelte
git checkout fast-hydration
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
