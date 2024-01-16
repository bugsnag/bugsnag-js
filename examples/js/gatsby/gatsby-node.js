const { BugsnagSourceMapUploaderPlugin } = require("webpack-bugsnag-plugins")

exports.onCreateWebpackConfig = ({ actions }) => {
  // Upload source maps by adding BugsnagSourceMapUploaderPlugin to the webpack configuration
  // on production builds only
  if (process.env.NODE_ENV === 'production') {
    actions.setWebpackConfig({
      plugins: [
        new BugsnagSourceMapUploaderPlugin({
          apiKey: process.env.GATSBY_BUGSNAG_API_KEY,
          appVersion: '1.2.3',
          overwrite: true,
          // publicPath must match where the site is being served from
          publicPath: 'http://localhost:9000/'
        })
      ]
    })
  }
}