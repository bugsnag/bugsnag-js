const jsonStringify = require('@bugsnag/safe-json-stringify')

module.exports = report => {
  let payload = jsonStringify(report)
  if (payload.length > 10e5) {
    delete report.events[0].metaData
    report.events[0].metaData = {
      notifier:
`WARNING!
The serialized payload was ${payload.length / 10e5}MB. The limit is 1MB.
report.metaData was stripped to make the payload of a deliverable size.`
    }
    payload = jsonStringify(report)
    if (payload.length > 10e5) throw new Error('payload exceeded 1MB limit')
  }
  return payload
}
