const path = require('path')
const pkg = require('./package.json')
const { DefinePlugin } = require('webpack')

module.exports = {
  entry: './src/notifier.js',
  mode: 'development',
  devtool: 'inline-source-map',
  experiments: {
    outputModule: true
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'notifier.js',
    library: {
      type: 'module'
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
      },
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  plugins: [new DefinePlugin({
    __VERSION__: JSON.stringify(pkg.version)
  })]
}
