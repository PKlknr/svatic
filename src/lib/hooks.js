const {maybeLog} = require('.');

const runAllHooks = hooks =>
  Promise.all(hooks.map(hook => maybeLog('>>> HOOK') || hook.task()));

module.exports.runAllHooks = runAllHooks;
