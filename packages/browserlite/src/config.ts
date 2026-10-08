import { schema } from '@bugsnag/core'

const config = {
  // session tracking requires @bugsnag/plugin-browser-session, which is not
  // bundled by default, so auto tracking is disabled unless the plugin is
  // explicitly added via the `plugins` config option
  autoTrackSessions: {
    ...schema.autoTrackSessions,
    defaultValue: () => false
  },
  releaseStage: {
    ...schema.releaseStage,
    defaultValue: () => {
      if (/^localhost(:\d+)?$/.test(window.location.host)) return 'development'
      return 'production'
    }
  },
  appType: {
    ...schema.appType,
    defaultValue: () => 'browser'
  },
  logger: {
    ...schema.logger,
    defaultValue: () =>
      // set logger based on browser capability
      (typeof console !== 'undefined' && typeof console.debug === 'function')
        ? getPrefixedConsole()
        : undefined
  }
}

const getPrefixedConsole = () => {
  const logger: Record<string, (...args: unknown[]) => void> = {}
  const consoleLog = console.log
  ;(['debug', 'info', 'warn', 'error'] as const).forEach((method) => {
    const consoleMethod = console[method]
    logger[method] = typeof consoleMethod === 'function'
      ? consoleMethod.bind(console, '[bugsnag]')
      : consoleLog.bind(console, '[bugsnag]')
  })
  return logger
}

export default config
