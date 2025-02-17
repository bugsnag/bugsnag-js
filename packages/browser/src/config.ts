import { schema } from '@bugsnag/core'
import getPrefixedConsole from './get-prefixed-console'

const config = {
  releaseStage: {
    ...schema.releaseStage, ...{
      defaultValue: () => {
        if (/^localhost(:\d+)?$/.test(window.location.host)) return 'development'
        return 'production'
      }
    }
  },
  appType: {
    ...schema.appType, ...{
      defaultValue: () => 'browser'
    }
  },
  logger: {
    ...schema.logger, ...{
      defaultValue: () =>
        // set logger based on browser capability
        (typeof console !== 'undefined' && typeof console.debug === 'function')
          ? getPrefixedConsole()
          : undefined
    }
  }
}

export default config
