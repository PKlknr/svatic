module.exports = onEmpty => {
  let q = [];
  let busy = false;

  const run = () => {
    busy = true;
    const f = q.shift();
    Promise.resolve(f())
      .then(() => {
        if (q.length) {
          run();
        } else {
          busy = false;
          onEmpty();
        }
      })
      .catch(e => {
        q = [];
        busy = false;
        onEmpty(e);
      });
  };

  return task => {
    q.push(task);
    if (!busy) {
      run();
    }
  };
};
