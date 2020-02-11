const fs = require('fs');
const path = require('path');

const {init, parse} = require('es-module-lexer');

const rec = (destDir, fn) => {
  const seen = new Set();
  const r = new Set();

  const reci = fn => {
    if (seen.has(fn)) {
      return r;
    }
    seen.add(fn);

    const f = fs.readFileSync(path.join(destDir, fn), 'utf-8');
    const [imports] = parse(f);

    const imp2 = imports
      .map(i => f.substr(i.s, i.e - i.s))
      .map(i => (i.startsWith('.') ? path.join(path.dirname(fn), i) : i));

    if (imp2.length) {
      imp2.forEach(f => r.add(f));
      imp2.map(f => reci(f));

      return r;
    } else {
      return r;
    }
  };
  return reci(fn);
};

const lex = (destDir, filename) => init.then(() => rec(destDir, filename));

const buildImportMap = (dir, entries) =>
  Promise.all(entries.map(src => lex(dir, src + '.js').then(r => [src, r])));

module.exports = {buildImportMap};
