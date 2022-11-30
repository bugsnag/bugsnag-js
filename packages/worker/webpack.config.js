const path = require('path')

module.exports = {
  entry: './src/notifier.ts',
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
      }
    ]
  }
}
