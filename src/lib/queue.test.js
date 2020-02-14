const tap = require('tap');
const makeQueue = require('./queue');

const delay = delay => new Promise(resolve => setTimeout(resolve, delay));

tap.test('makeQueue()', ({end, deepEqual}) => {
  const r = [];

  const queue = makeQueue(() => {
    deepEqual(r, [1, 2, 3, 4], 'All tasks executed sequentially');
    end();
  });

  queue(async () => r.push(1));
  queue(() => r.push(2));
  queue(() => delay(300).then(() => r.push(3)));
  queue(() => delay(100).then(() => r.push(4)));
});

tap.test('makeQueue()', ({end, equal, deepEqual}) => {
  const r = [];

  const queue = makeQueue(err => {
    equal(err.message, 'Boom', 'onEmpty called with error');
    deepEqual(r, [1], 'queue stopped after error');
    end();
  });

  queue(async () => r.push(1));
  queue(async () => {
    throw new Error('Boom');
  });
  queue(async () => r.push(2));
});
