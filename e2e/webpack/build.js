const { spawnSync } = require('child_process')

const { stdout, stderr } = spawnSync('./node_modules/.bin/webpack', [
  '--config', 'e2e/webpack/webpack.config.js'
], { encoding: 'utf8' })
if (stderr.length) throw new Error(stderr)

console.log(stdout)
