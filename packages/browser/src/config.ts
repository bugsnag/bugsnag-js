import { Config } from '@bugsnag/core'
import { schema } from '@bugsnag/core/config'
import assign from '@bugsnag/core/lib/es-utils/assign'
import map from '@bugsnag/core/lib/es-utils/map'

export interface BrowserConfig extends Config {
  maxEvents?: number
  collectUserIp?: boolean
  generateAnonymousId?: boolean
  trackInlineScripts?: boolean
}

export default {
  releaseStage: assign({}, schema.releaseStage, {
    defaultValue: () => {
      if (/^localhost(:\d+)?$/.test(window.location.host)) return 'development'
      return 'production'
    }
  }),
  appType: {
    ...schema.appType,
    defaultValue: () => 'browser'
  },
  logger: assign({}, schema.logger, {
    defaultValue: () =>
      // set logger based on browser capability
      (typeof console !== 'undefined' && typeof console.debug === 'function')
        ? getPrefixedConsole()
        : undefined
  })
}

type ConsoleMethods = 'debug' | 'info' | 'warn' | 'error'

const getPrefixedConsole = () => {
  const logger: Record<string, () => void> = {}
  const consoleLog = console.log
  map(['debug', 'info', 'warn', 'error'], (method: ConsoleMethods) => {
    const consoleMethod = console[method]
    logger[method] = typeof consoleMethod === 'function'
      ? consoleMethod.bind(console, '[bugsnag]')
      : consoleLog.bind(console, '[bugsnag]')
  })
  return logger
}
