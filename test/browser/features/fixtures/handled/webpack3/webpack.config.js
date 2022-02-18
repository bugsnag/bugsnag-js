const path = require('path')
const webpack = require('webpack')
const es3ifyPlugin = require('es3ify-webpack-plugin')

module.exports = {
  entry: { a: './src/a.js', b: './src/b.js', c: './src/c.js' },
  devtool: 'sourcemap',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  plugins: [
    new es3ifyPlugin(),
    // new webpack.optimize.UglifyJsPlugin({ compress: false, mangle: false, ie8: true })
  ]
}
