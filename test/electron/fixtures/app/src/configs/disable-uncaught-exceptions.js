module.exports = () => {
  // disable alert on exception
  process.on('uncaughtException', () => {})

  return {
    enabledErrorTypes: {
      unhandledExceptions: false
    }
  }
}
