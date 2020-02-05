const snowpack = require('./snowpack');

const makeInjectString = beforeString => content => html =>
  html.replace(beforeString, content + beforeString);

const debug = true;
// eslint-disable-next-line no-console
const maybeLog = (...args) => (debug ? console.log('@@', ...args) : undefined);

module.exports = {
  injectIntoHead: makeInjectString('</head>'),
  injectIntoBody: makeInjectString('</body>'),
  snowpack,
  maybeLog,
};


