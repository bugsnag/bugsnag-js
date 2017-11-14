const { spawnSync } = require('child_process')

const bundle = spawnSync('./bin/bundle')
spawnSync('./bin/minify', [ './e2e/script/serve/bugsnag.dist.js' ], { input: bundle.stdout })
