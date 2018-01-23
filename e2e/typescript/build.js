const { spawnSync } = require('child_process')

const { stderr } = spawnSync('./node_modules/.bin/browserify', [
  `${__dirname}/app.ts`,
  '-g',
  'babelify',
  '-p',
  '[',
  'tsify',
  '--strict',
  ']',
  '-o',
  `${__dirname}/serve/bundle.js`
], { encoding: 'utf8' })

if (stderr.length) throw new Error(stderr)
