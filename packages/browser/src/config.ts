import { schema } from '@bugsnag/core/config'
import assign from '@bugsnag/core/lib/es-utils/assign'
import getPrefixedConsole from './get-prefixed-console'

const config = {
  releaseStage: assign({}, schema.releaseStage, {
    defaultValue: () => {
      if (/^localhost(:\d+)?$/.test(window.location.host)) return 'development'
      return 'production'
    }
  }),
  appType: assign({}, schema.appType, {
    defaultValue: () => 'browser'
  }),
  logger: assign({}, schema.logger, {
    defaultValue: () =>
      // set logger based on browser capability
      (typeof console !== 'undefined' && typeof console.debug === 'function')
        ? getPrefixedConsole()
        : undefined
  })
}

export default config
