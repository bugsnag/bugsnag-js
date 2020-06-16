const webpack = require('webpack')
const nextSourceMaps = require('@zeit/next-source-maps')
// const { BugsnagSourceMapUploaderPlugin } = require('webpack-bugsnag-plugins')

module.exports = nextSourceMaps()({
  webpack: (config, { isServer, buildId }) => {
    // TODO source map uploads, once for browser and once for server
    // TODO handle appVersion

    // new BugsnagSourceMapUploaderPlugin({
    //   apiKey: process.env.NEXT_PUBLIC_BUGSNAG_API_KEY,
    //   appVersion: buildId
    // })

    return config
  },
})
