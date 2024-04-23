const { readdirSync } = require('fs')
const { parse } = require('path')
const webpack = require('webpack')
const entrypoints = {}
readdirSync('./preloads').forEach(name => {
  entrypoints[parse(name).name] = `./preloads/${name}`
})

module.exports = {
  devtool: 'hidden-source-map',
  entry: entrypoints,
  output: {
    filename: '[name].js'
  },
  resolve: {
    fallback: {
      fs: false,
      path: false
    }
  },
  plugins: [
    new webpack.ProgressPlugin()
  ]
}
