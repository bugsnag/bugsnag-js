var path = require('path')
var webpack = require('webpack')

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.bundle.js',
    library: '',
    libraryTarget: 'commonjs'
  },
  target: 'node'
}
