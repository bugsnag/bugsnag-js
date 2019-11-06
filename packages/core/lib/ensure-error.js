const iserror = require('./iserror')

module.exports = (maybeError) => {
  const actualError = iserror(maybeError)
    ? maybeError
    : new Error('Handled a non-error. See "error" tab for more detail.')
  let metadata
  if (maybeError !== actualError) {
    metadata = { 'non-error value': String(maybeError) }
  }
  return { actualError, metadata }
}
