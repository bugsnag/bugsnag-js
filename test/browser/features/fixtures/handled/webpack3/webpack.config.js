const path = require('path')
const webpack = require('webpack')
const es3ifyPlugin = require('es3ify-webpack-plugin')

module.exports = {
  entry: {
    notify_new_error: './src/notify_new_error.js',
    try_catch_notify: './src/try_catch_notify.js',
    promise_catch: './src/promise_catch.js'
  },
  devtool: 'sourcemap',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  plugins: [
    new es3ifyPlugin()
    // UglifyJs plugin disabled due to ES6 compatibility issues
  ]
}
