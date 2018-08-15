const jsonStringify = require('@bugsnag/safe-json-stringify')
const { includes } = require('./es-utils')

module.exports.report = (report, filters) => {
  const replacer = (key, value) => !includes(filters, key) ? value : '[FILTERED]'
  let payload = jsonStringify(report, replacer)
  if (payload.length > 10e5) {
    delete report.events[0].metaData
    report.events[0].metaData = {
      notifier:
`WARNING!
Serialized payload was ${payload.length / 10e5}MB (limit = 1MB)
metaData was removed`
    }
    payload = jsonStringify(report, replacer)
    if (payload.length > 10e5) throw new Error('payload exceeded 1MB limit')
  }
  return payload
}

module.exports.session = (report, filters) => {
  return jsonStringify(report, (key, value) => !includes(filters, key) ? value : '[FILTERED]')
}
