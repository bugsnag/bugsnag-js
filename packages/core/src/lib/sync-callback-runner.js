module.exports = (callbacks, callbackArg, callbackType, logger) => {
  let ignore = false
  const cbs = callbacks.slice()
  while (!ignore) {
    if (!cbs.length) break
    try {
      ignore = cbs.pop()(callbackArg) === false
    } catch (e) {
      logger.error(`Error occurred in ${callbackType} callback, continuing anyway…`)
      logger.error(e)
    }
  }
  return ignore
}
