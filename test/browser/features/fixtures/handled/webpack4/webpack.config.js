const path = require('path')
const es3ifyPlugin = require('es3ify-webpack-plugin')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

module.exports = {
  entry: { a: './src/notify_new_error.js', b: './src/try_catch_notify.js', c: './src/promise_catch.js' },
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
