const path = require('path')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const webpack = require('webpack')

module.exports = {
  entry: { app: './src/app.js' },
  mode: 'production',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  plugins: [
    new UglifyJsPlugin({ sourceMap: true, uglifyOptions: { compress: false, mangle: false, ie8: true } }),
    new webpack.LoaderOptionsPlugin({
      options: {
        loaders: [
          {
            test: /\.js$/,
            include: /\/node_modules\//,
            loader: 'es3ify'
          }
        ]
      }
    })
  ]
}
