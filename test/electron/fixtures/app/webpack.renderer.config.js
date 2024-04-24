const { readdirSync } = require('fs')
const { parse } = require('path')
const entrypoints = {}
readdirSync('./src/preloads').forEach(name => {
  entrypoints[parse(name).name] = `./src/preloads/${name}`
})

module.exports = {
  resolve: {
    fallback: {
      fs: false,
      path: require.resolve('path-browserify')
    }
  },
  module: {
    rules: require('./webpack.rules')
  }
}
