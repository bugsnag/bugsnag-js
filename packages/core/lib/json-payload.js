const jsonStringify = require('@bugsnag/safe-json-stringify')
const REPORT_REDACTED_PATHS = [
  'events.[].metaData',
  'events.[].breadcrumbs.metaData',
  'events.[].request'
]
module.exports.event = (event, redactedKeys) => {
  let payload = jsonStringify(event, null, null, { redactedPaths: REPORT_REDACTED_PATHS, redactedKeys })
  if (payload.length > 10e5) {
    delete event.events[0]._metaData
    event.events[0].metaData = {
      notifier: {
        warning:
`WARNING!
Serialized payload was ${payload.length / 10e5}MB (limit = 1MB)
metadata was removed`
      }
    }
    payload = jsonStringify(event, null, null, { redactedPaths: REPORT_REDACTED_PATHS, redactedKeys })
    if (payload.length > 10e5) throw new Error('payload exceeded 1MB limit')
  }
  return payload
}

module.exports.session = (session, redactedKeys) => {
  const payload = jsonStringify(session, null, null)
  if (payload.length > 10e5) throw new Error('payload exceeded 1MB limit')
  return payload
}
