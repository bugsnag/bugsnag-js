var path = require('path')
var webpack = require('webpack')

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.bundle.js',
    library: { type: 'commonjs' },
  },
  // Minification is disabled so the bundle stays readable and the test
  // exercises the code as it is published.
  optimization: {
    minimize: false,
  },
  target: 'node'
}
