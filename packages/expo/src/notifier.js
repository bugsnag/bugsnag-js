const name = 'Bugsnag Expo'
const { version } = require('../package.json')
const url = 'https://github.com/bugsnag/bugsnag-js'
const React = require('react')
const { Constants } = require('expo')

const Client = require('@bugsnag/core/client')

const schema = { ...require('@bugsnag/core/config').schema, ...require('./config') }

const plugins = [
  require('@bugsnag/plugin-react-native-global-error-handler'),
  require('@bugsnag/plugin-react-native-unhandled-rejection'),
  require('@bugsnag/plugin-console-breadcrumbs'),
  require('@bugsnag/plugin-network-breadcrumbs')
]

const bugsnagReact = require('@bugsnag/plugin-react')

module.exports = (opts) => {
  // handle very simple use case where user supplies just the api key as a string
  if (typeof opts === 'string') opts = { apiKey: opts }

  const bugsnag = new Client({ name, version, url })

  bugsnag.setOptions(opts)
  bugsnag.configure(schema)

  plugins.forEach(pl => {
    switch (pl.name) {
      case 'networkBreadcrumbs':
        bugsnag.use(pl, () => [
          bugsnag.config.endpoints.notify,
          bugsnag.config.endpoints.sessions,
          Constants.manifest.logUrl
        ])
        break
      default:
        bugsnag.use(pl)
    }
  })
  bugsnag.use(bugsnagReact, React)

  bugsnag._logger.debug(`Loaded!`)

  return bugsnag
}

module.exports['default'] = module.exports
