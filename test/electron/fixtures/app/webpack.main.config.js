const { readdirSync } = require('fs')
const webpack = require('webpack')
const { join, parse } = require('path')
const entrypoints = { index: './main.js' }
readdirSync('./configs').forEach(name => {
  entrypoints[parse(name).name] = `./configs/${name}`
})

module.exports = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: entrypoints,
  // Put your normal webpack config below here
  devtool: 'hidden-source-map',
  output: {
    filename: '[name].js'
  },
  mode: 'production',
  plugins: [
    new webpack.ProgressPlugin(),
    new webpack.DefinePlugin({
      baseBugsnagConfig: JSON.stringify({
        apiKey: process.env.BUGSNAG_API_KEY,
        endpoints: {
          notify: process.env.BUGSNAG_ENDPOINT_NOTIFY,
          sessions: process.env.BUGSNAG_ENDPOINT_SESSIONS,
          minidumps: process.env.BUGSNAG_ENDPOINT_MINIDUMPS
        }
      }),
      preloadRelativeDir: JSON.stringify(join('..', 'renderer')),
      htmlRelativePath: JSON.stringify(join('..', 'renderer', 'main_window', 'index.html'))
    })
  ],
  module: {
    rules: require('./webpack.rules')
  }
}
