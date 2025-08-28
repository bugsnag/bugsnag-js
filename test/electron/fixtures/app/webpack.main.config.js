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
      preloadRelativeDir: JSON.stringify(join('..', 'renderer')),
      htmlRelativePath: JSON.stringify(join('..', 'renderer', 'main_window', 'index.html'))
    }),
    new webpack.EnvironmentPlugin({
      BUGSNAG_API_KEY: process.env.BUGSNAG_API_KEY,
      BUGSNAG_ENDPOINT_NOTIFY: process.env.BUGSNAG_ENDPOINT_NOTIFY,
      BUGSNAG_ENDPOINT_SESSIONS: process.env.BUGSNAG_ENDPOINT_SESSIONS,
      BUGSNAG_ENDPOINT_MINIDUMPS: process.env.BUGSNAG_ENDPOINT_MINIDUMPS
    })
  ],
  module: {
    rules: require('./webpack.rules')
  }
}
