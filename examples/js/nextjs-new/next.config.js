const {
  BugsnagSourceMapUploaderPlugin,
  BugsnagBuildReporterPlugin,
} = require('webpack-bugsnag-plugins');

module.exports = {
  productionBrowserSourceMaps: true,
  webpack(config, { buildId, isServer, webpack }) {
    config.plugins.push(
      new webpack.DefinePlugin({
        // Define the build id so that it can be accessed in the client when reporting errors
        'process.env.NEXT_BUILD_ID': JSON.stringify(buildId),
        'process.env.NEXT_IS_SERVER': JSON.stringify(isServer),
      })
    )
    
    // Avoid including '@bugsnag/plugin-aws-lambda' module in the client side bundle
    // See https://arunoda.me/blog/ssr-and-server-only-modules
    if (!isServer) {
      config.plugins.push(new webpack.IgnorePlugin(/@bugsnag\/plugin-aws-lambda/));
    }

    // Upload source maps on production build
    if (
      process.env.NEXT_PUBLIC_BUGSNAG_API_KEY &&
      process.env.NODE_ENV === 'production'
    ) {
      config.plugins.push(
        new BugsnagBuildReporterPlugin(
          {
            apiKey: process.env.NEXT_PUBLIC_BUGSNAG_API_KEY,
            appVersion: buildId,
            releaseStage: process.env.NODE_ENV,
          },
          { logLevel: 'debug' },
        ),
        new BugsnagSourceMapUploaderPlugin({
          apiKey: process.env.NEXT_PUBLIC_BUGSNAG_API_KEY,
          appVersion: buildId,
          publicPath: 'http://localhost:3000/_next/',
        }),
      )
    }

    return config
  },
}
