const { spawnSync } = require('child_process')

const bundle = spawnSync('./bin/bundle')
spawnSync('./bin/minify', [ `${__dirname}/serve/bugsnag.dist.js` ], { input: bundle.stdout })
