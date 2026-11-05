const jsonStringify = require('@bugsnag/safe-json-stringify')
const EVENT_REDACTION_PATHS = [
  'events.[].metaData',
  'events.[].breadcrumbs.[].metaData',
  'events.[].request',
  'events.[].response'
]

const boundedOptions = maxBytes => {
  if (!jsonStringify.supportsMaxBytes) {
    throw Object.assign(new Error('Configured delivery byte limits require safe-json-stringify maxBytes support'), { code: 'ERR_DELIVERY_SERIALIZER' })
  }
  return { maxBytes }
}

module.exports.event = (event, redactedKeys, maxBytes) => {
  if (maxBytes !== undefined) {
    return jsonStringify(event, null, null, { ...boundedOptions(maxBytes), redactedPaths: EVENT_REDACTION_PATHS, redactedKeys })
  }
  let payload = jsonStringify(event, null, null, { redactedPaths: EVENT_REDACTION_PATHS, redactedKeys })
  if (payload.length > 10e5) {
    event.events[0]._metadata = {
      notifier:
`WARNING!
Serialized payload was ${payload.length / 10e5}MB (limit = 1MB)
metadata was removed`
    }
    payload = jsonStringify(event, null, null, { redactedPaths: EVENT_REDACTION_PATHS, redactedKeys })
  }
  return payload
}

module.exports.session = (session, redactedKeys, maxBytes) => {
  if (maxBytes !== undefined) return jsonStringify(session, null, null, boundedOptions(maxBytes))
  const payload = jsonStringify(session, null, null)
  return payload
}
