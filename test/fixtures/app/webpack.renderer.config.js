const { readdirSync } = require('fs')
const { parse } = require('path')
const webpack = require('webpack')
const entrypoints = {}
readdirSync('./preloads').forEach(name => {
  entrypoints[parse(name).name] = `./preloads/${name}`
})

module.exports = {
  entry: entrypoints,
  output: {
    filename: '[name].js'
  },
  plugins: [
    new webpack.ProgressPlugin()
  ]
}
