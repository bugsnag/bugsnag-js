const { spawnSync } = require('child_process')

spawnSync('./node_modules/.bin/browserify', [
  './e2e/browserify/app.js',
  '-g',
  'babelify',
  '-o',
  './e2e/browserify/serve/bundle.js'
])
