const glob = require('glob')
const { resolve, join } = require('path')

glob.sync(join(resolve(__dirname, '..'), '*/build.js')).forEach(p => require(p))
