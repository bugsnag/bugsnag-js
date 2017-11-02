const { spawnSync } = require('child_process')

const { stderr } = spawnSync('./node_modules/.bin/browserify', [
  './e2e/typescript/app.ts',
  '-g',
  'babelify',
  '-p',
  '[',
  'tsify',
  '--strict',
  ']',
  '-o',
  './e2e/typescript/serve/bundle.js'
], { encoding: 'utf8' })

if (stderr.length) throw new Error(stderr)
