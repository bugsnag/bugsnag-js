const jsonStringify = require('fast-safe-stringify')

/*
 * Throttles and dedupes error reports
 */

module.exports = {
  name: 'throttle',
  init: (client) => {
    // track history of sent events for each init of the plugin
    let history = []

    // add beforeSend hook
    client.config.beforeSend.push((report) => {
      // maintain the history (remove events that have fallen beyond the window)
      const now = Date.now()
      history = history.filter(event => event.time > now - client.config.eventWindowSize)

      // is this is a duplicate?
      const dupes = seen(history, report)
      // has the duplicate quota has been exceeded?
      if (dupes > client.config.maxDuplicateEventsPerWindow) return report.ignore()

      // have too many events been sent in the window already?
      if (history.length >= client.config.maxEventsPerWindow) return report.ignore()

      // this event got through, so track it
      history.push({ time: now, report: serialise(report) })
    })
  }
}

// returns the number of times an identical report
// occurs in the array of `history`
const seen = module.exports._seen = (history, report) => history.reduce((accum, event) => {
  return event.report === serialise(report) ? accum + 1 : accum
}, 0)

// serialise the properties of a report that we care about for equality comparison
const serialise = module.exports._serialise = report => jsonStringify({
  app: report.app,
  apiKey: report.apiKey,
  // breadcrumbs: report.breadcrumbs, // <-- ignore breadcrumbs
  context: report.context,
  // device: report.device, <-- ignore device time for equality check
  errorClass: report.errorClass,
  errorMessage: report.errorMessage,
  groupingHash: report.groupingHash,
  metaData: report.metaData,
  _handledState: report._handledState,
  stacktrace: report.stacktrace,
  user: report.user
})
