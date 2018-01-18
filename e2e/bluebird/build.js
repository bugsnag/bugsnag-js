const { spawnSync } = require('child_process')
const { readFileSync, writeFileSync } = require('fs')

const bundle = spawnSync('./bin/bundle')
spawnSync('./bin/minify', [ `${__dirname}/serve/bugsnag.dist.js` ], { input: bundle.stdout })
writeFileSync(
  `${__dirname}/serve/bluebird.js`,
  readFileSync('./node_modules/bluebird/js/browser/bluebird.js')
)
