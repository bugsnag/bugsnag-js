import { join } from 'path'
import consola from 'consola'
import Bugsnag from '@bugsnag/js'
const BugsnagPluginExpress = require('@bugsnag/plugin-express')

export default function (options) {
  const logger = consola.withScope('Bugsnag')
  logger.info('Configuring')

  const bugsnagOptions = { ...this.options.bugsnag, ...options.bugsnag }

  logger.info('Adding browser plugin')
  this.addPlugin({
    src: join(__dirname, 'client.js'),
    options: { apiKey: bugsnagOptions.browserApiKey },
    ssr: false
  })

  Bugsnag.start({
    apiKey: bugsnagOptions.serverApiKey,
    logger,
    plugins: [BugsnagPluginExpress]
  })

  logger.info('Adding server handlers')
  this.nuxt.hook('render:setupMiddleware', app => app.use(Bugsnag.getPlugin('express').requestHandler))
  this.nuxt.hook('render:errorMiddleware', app => app.use(Bugsnag.getPlugin('express').errorHandler))
  this.nuxt.hook('generate:routeFailed', ({ route, errors }) => {
    errors.forEach(({ error }) => Bugsnag.notify(error, event => { event.addMetadata({ route }) }))
  })
}
