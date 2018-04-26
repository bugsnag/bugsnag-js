const jsonStringify = require('@bugsnag/safe-json-stringify')

module.exports = report => {
  let payload = jsonStringify(report)
  if (payload.length > 10e5) {
    delete report.events[0].metaData
    report.events[0].metaData = {
      notifier:
`WARNING!
Serialized payload was ${payload.length / 10e5}MB (limit = 1MB)
metaData was removed`
    }
    payload = jsonStringify(report)
    if (payload.length > 10e5) throw new Error('payload exceeded 1MB limit')
  }
  return payload
}
