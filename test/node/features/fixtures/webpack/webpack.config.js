var path = require('path')
var webpack = require('webpack')

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.bundle.js',
    library: '',
    libraryTarget: 'commonjs',
  },
  // The version of terser shipping with webpack 4 does not work in node 20
  // without the `--openssl-legacy-provider` flag. So we disable minification
  // in order to continue being able to test webpack 4 on node 20.
  optimization: {
    minimize: false,
  },
  target: 'node'
}
