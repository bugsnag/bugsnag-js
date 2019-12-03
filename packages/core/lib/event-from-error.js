const Event = require('../event')
const iserror = require('./iserror')

module.exports = (maybeError, handledState) => {
  const actualError = iserror(maybeError)
    ? maybeError
    : new Error('Handled a non-error. See "error" tab for more detail.')
  const event = new Event(
    actualError.name,
    actualError.message,
    Event.getStacktrace(actualError),
    handledState,
    maybeError
  )
  if (maybeError !== actualError) event.addMetadata('error', 'non-error value', String(maybeError))
  return event
}
