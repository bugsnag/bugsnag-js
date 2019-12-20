const jsonStringify = require('@bugsnag/safe-json-stringify')
const EVENT_REDACTION_PATHS = [
  'events.[].metaData',
  'events.[].breadcrumbs.[].metaData',
  'events.[].request'
]

module.exports.event = (event, redactedKeys) => {
  let payload = jsonStringify(event, null, null, { redactedPaths: EVENT_REDACTION_PATHS, redactedKeys })
  if (payload.length > 10e5) {
    event.events[0]._metadata = {
      notifier:
`WARNING!
Serialized payload was ${payload.length / 10e5}MB (limit = 1MB)
metadata was removed`
    }
    payload = jsonStringify(event, null, null, { redactedPaths: EVENT_REDACTION_PATHS, redactedKeys })
    if (payload.length > 10e5) throw new Error('payload exceeded 1MB limit')
  }
  return payload
}

module.exports.session = (event, redactedKeys) => {
  const payload = jsonStringify(event, null, null)
  if (payload.length > 10e5) throw new Error('payload exceeded 1MB limit')
  return payload
}
