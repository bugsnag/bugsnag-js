const path = require('path')
const pkg = require('./package.json')
const { DefinePlugin } = require('webpack')

module.exports = {
  entry: './src/notifier.js',
  mode: 'production',
  devtool: 'source-map',
  optimization: {
    minimize: false
  },
  experiments: {
    outputModule: true
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bugsnag.web-worker.mjs',
    module: true
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts/,
        loader: 'ts-loader'
      }
    ]
  },
  plugins: [new DefinePlugin({
    __VERSION__: JSON.stringify(pkg.version)
  })]
}
