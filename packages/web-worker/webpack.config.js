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
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bugsnag.web-worker.js',
    library: {
      name: 'Bugsnag',
      type: 'umd',
      export: 'default'
    }
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
