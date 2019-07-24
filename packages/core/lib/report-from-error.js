const Report = require('../report')
const iserror = require('./iserror')

module.exports = (maybeError, handledState) => {
  const actualError = iserror(maybeError)
    ? maybeError
    : new Error('Handled a non-error. See "error" tab for more detail.')
  const report = new Report(
    actualError.name,
    actualError.message,
    Report.getStacktrace(actualError),
    handledState,
    maybeError
  )
  if (maybeError !== actualError) report.updateMetaData('error', 'non-error value', JSON.stringify(maybeError))
  return report
}
