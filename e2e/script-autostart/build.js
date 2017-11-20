const { spawnSync } = require('child_process')
const { writeFileSync } = require('fs')
writeFileSync('./e2e/script-autostart/serve/bugsnag.dist.js', spawnSync('./bin/bundle').stdout)
