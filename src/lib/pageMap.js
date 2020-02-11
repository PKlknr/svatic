module.exports.evalPageMap = pageMap =>
  typeof pageMap === 'function' ? pageMap() : pageMap;
