const { readdirSync } = require('fs')
const { parse } = require('path')
const webpack = require('webpack')
const entrypoints = {}
readdirSync('./src/preloads').forEach(name => {
  entrypoints[parse(name).name] = `./src/preloads/${name}`
})

module.exports = {
  devtool: 'hidden-source-map',
  entry: entrypoints,
  output: {
    filename: '[name].js'
  },
  resolve: {
    fallback: {
      fs: require.resolve('browserify-fs'),
      path: require.resolve('path-browserify'),
      stream: require.resolve('stream-browserify')
    }
  },
  plugins: [
    new webpack.ProgressPlugin()
  ]
}
