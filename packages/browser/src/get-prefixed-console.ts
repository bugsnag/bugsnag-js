import map from 'packages/core/lib/es-utils/map'

type LoggerMethod = 'debug' | 'info' | 'warn' | 'error'

const getPrefixedConsole = () => {
  const logger: Record<string, unknown> = {}
  const consoleLog = console.log
  map(['debug', 'info', 'warn', 'error'], (method: LoggerMethod) => {
    const consoleMethod = console[method]
    logger[method] = typeof consoleMethod === 'function'
      ? consoleMethod.bind(console, '[bugsnag]')
      : consoleLog.bind(console, '[bugsnag]')
  })
  return logger
}

export default getPrefixedConsole
