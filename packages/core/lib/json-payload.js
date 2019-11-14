const jsonStringify = require('@bugsnag/safe-json-stringify')
const EVENT_FILTER_PATHS = [
  'events.[].app',
  'events.[].metaData',
  'events.[].user',
  'events.[].breadcrumbs',
  'events.[].request',
  'events.[].device'
]
const SESSION_FILTER_PATHS = [
  'device',
  'app',
  'user'
]

module.exports.event = (event, filterKeys) => {
  let payload = jsonStringify(event, null, null, { filterPaths: EVENT_FILTER_PATHS, filterKeys })
  if (payload.length > 10e5) {
    delete event.events[0].metaData
    event.events[0].metaData = {
      notifier:
`WARNING!
Serialized payload was ${payload.length / 10e5}MB (limit = 1MB)
metaData was removed`
    }
    payload = jsonStringify(event, null, null, { filterPaths: EVENT_FILTER_PATHS, filterKeys })
    if (payload.length > 10e5) throw new Error('payload exceeded 1MB limit')
  }
  return payload
}

module.exports.session = (event, filterKeys) => {
  const payload = jsonStringify(event, null, null, { filterPaths: SESSION_FILTER_PATHS, filterKeys })
  if (payload.length > 10e5) throw new Error('payload exceeded 1MB limit')
  return payload
}
