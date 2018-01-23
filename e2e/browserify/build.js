const { spawnSync } = require('child_process')

spawnSync('./node_modules/.bin/browserify', [
  `${__dirname}/app.js`,
  '-g',
  'babelify',
  '-o',
  `${__dirname}/serve/bundle.js`
])
