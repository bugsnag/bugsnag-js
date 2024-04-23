const { readdirSync } = require('fs')
const webpack = require('webpack')
const { join, parse } = require('path')
const entrypoints = { index: './src/main.js' }
readdirSync('./src/configs').forEach(name => {
  entrypoints[parse(name).name] = `./src/configs/${name}`
})

module.exports = {
  devtool: 'hidden-source-map',
  entry: entrypoints,
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
