const runAllHooks = hooks => Promise.all(hooks.map(hook => hook.task()));

module.exports.runAllHooks = runAllHooks;
