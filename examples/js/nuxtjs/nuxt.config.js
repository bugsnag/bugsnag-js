const pkg = require('./package')
const { BugsnagSourceMapUploaderPlugin } = require('webpack-bugsnag-plugins')

module.exports = {
  mode: 'universal',

  /*
  ** Headers of the page
  */
  head: {
    title: pkg.name,
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: pkg.description }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },

  /*
  ** Customize the progress-bar color
  */
  loading: { color: '#fff' },

  /*
  ** Global CSS
  */
  css: [
  ],

  /*
  ** Plugins to load before mounting the App
  */
  plugins: [
  ],

  /*
  ** Nuxt.js modules
  */
  modules: [
    '~/modules/bugsnag'
  ],

  bugsnag: {
    browserApiKey: 'YOUR_BROWSER_API_KEY',
    serverApiKey: 'YOUR_SERVER_API_KEY'
  },

  /*
  ** Build configuration
  */
  build: {
    /*
    ** You can extend webpack config here
    */
    extend (config, { isDev, isClient }) {
      if (!isDev && isClient) {

        config.devtool = 'source-map'

        config.plugins.push(
          new BugsnagSourceMapUploaderPlugin({
            apiKey: 'YOUR_BROWSER_API_KEY',
            appVersion: require('./package.json').version,
            releaseStage: 'production',
            overwrite: true,
            publicPath: '*'
          })
        )
      }
    }
  }
}
