type LoggerMethod = 'debug' | 'info' | 'warn' | 'error'

const getPrefixedConsole = () => {
  const logger: Record<string, unknown> = {}
  const consoleLog = console.log
  const loggerMethods = ['debug', 'info', 'warn', 'error'] as const
  loggerMethods.map((method: LoggerMethod) => {
    const consoleMethod = console[method]
    logger[method] = typeof consoleMethod === 'function'
      ? consoleMethod.bind(console, '[bugsnag]')
      : consoleLog.bind(console, '[bugsnag]')
  })
  return logger
}

export default getPrefixedConsole
