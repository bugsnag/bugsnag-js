module.exports = {
  resolve: {
    fallback: {
      fs: false,
      path: require.resolve('path-browserify')
    }
  },
  module: {
    rules: require('./webpack.rules')
  }
}
