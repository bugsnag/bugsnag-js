const path = require('path')
const es3ifyPlugin = require('es3ify-webpack-plugin')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

module.exports = {
  entry: {
    notify_new_error: './src/notify_new_error.js',
    try_catch_notify: './src/try_catch_notify.js',
    promise_catch: './src/promise_catch.js'
  },
  mode: 'none',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  plugins: [
    new es3ifyPlugin(),
    new UglifyJsPlugin({ sourceMap: true, uglifyOptions: { compress: false, mangle: false, ie8: true } })
  ]
}
