const {
  BugsnagSourceMapUploaderPlugin,
  BugsnagBuildReporterPlugin,
} = require('webpack-bugsnag-plugins')

/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: true,
  webpack(config, { buildId, isServer, webpack }) {
    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env.NEXT_BUILD_ID': JSON.stringify(buildId),
      }),
    )

    // Avoid including '@bugsnag/plugin-aws-lambda' module in the client side bundle
    // See https://arunoda.me/blog/ssr-and-server-only-modules
    if (!isServer) {
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /@bugsnag\/plugin-aws-lambda/,
        }),
      )
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

module.exports = nextConfig
