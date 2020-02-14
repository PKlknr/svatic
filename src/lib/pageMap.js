module.exports.evalPageMap = pageMap =>
  typeof pageMap === 'function' ? pageMap() : pageMap;

module.exports.findPageBySrcPath = (pageMap, p) =>
  pageMap.find(x => x.src === p);
