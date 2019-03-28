const name = 'Bugsnag Node'
const version = '__VERSION__'
const url = 'https://github.com/bugsnag/bugsnag-js'

const Client = require('@bugsnag/core/client')

const delivery = require('@bugsnag/delivery-node')

// extend the base config schema with some node-specific options
const schema = { ...require('@bugsnag/core/config').schema, ...require('./config') }

// remove autoBreadcrumbs from the config schema
delete schema.autoBreadcrumbs

const pluginSurroundingCode = require('@bugsnag/plugin-node-surrounding-code')
const pluginInProject = require('@bugsnag/plugin-node-in-project')
const pluginStripProjectRoot = require('@bugsnag/plugin-strip-project-root')
const pluginServerSession = require('@bugsnag/plugin-server-session')
const pluginNodeDevice = require('@bugsnag/plugin-node-device')
const pluginNodeUncaughtException = require('@bugsnag/plugin-node-uncaught-exception')
const pluginNodeUnhandledRejection = require('@bugsnag/plugin-node-unhandled-rejection')
const pluginIntercept = require('@bugsnag/plugin-intercept')
const pluginContextualize = require('@bugsnag/plugin-contextualize')

const plugins = [
  pluginSurroundingCode,
  pluginInProject,
  pluginStripProjectRoot,
  pluginServerSession,
  pluginNodeDevice,
  pluginNodeUncaughtException,
  pluginNodeUnhandledRejection,
  pluginIntercept,
  pluginContextualize
]

module.exports = (opts, userPlugins = []) => {
  // handle very simple use case where user supplies just the api key as a string
  if (typeof opts === 'string') opts = { apiKey: opts }

  const bugsnag = new Client({ name, version, url })

  bugsnag.delivery(delivery)
  bugsnag.setOptions(opts)
  bugsnag.configure(schema)

  plugins.forEach(pl => bugsnag.use(pl))

  bugsnag._logger.debug(`Loaded!`)

  bugsnag.leaveBreadcrumb = function () {
    bugsnag._logger.warn('Breadcrumbs are not supported in Node.js yet')
    return this
  }

  return bugsnag
}

module.exports['default'] = module.exports
