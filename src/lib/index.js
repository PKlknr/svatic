const snowpack = require('./snowpack');

const makeInjectString = beforeString => content => html =>
  html.replace(beforeString, content + beforeString);

module.exports = {
  injectIntoHead: makeInjectString('</head>'),
  injectIntoBody: makeInjectString('</body>'),
  snowpack,
};
