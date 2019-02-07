const path = require('path')
const Es3ifyPlugin = require('es3ify-webpack-plugin')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

module.exports = {
  entry: { app: './src/app.js' },
  mode: 'production',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  plugins: [
    new Es3ifyPlugin(),
    new UglifyJsPlugin({ sourceMap: true, uglifyOptions: { compress: false, mangle: false, ie8: true } })
  ]
}
