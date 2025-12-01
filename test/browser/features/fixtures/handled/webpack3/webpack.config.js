const path = require('path')
const webpack = require('webpack')
const es3ifyPlugin = require('es3ify-webpack-plugin')

module.exports = {
  entry: { a: './src/notify_new_error.js', b: './src/try_catch_notify.js', c: './src/promise_catch.js' },
  devtool: 'sourcemap',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  plugins: [
    new es3ifyPlugin(),
    new webpack.optimize.UglifyJsPlugin({ compress: false, mangle: false, ie8: true })
  ]
}
