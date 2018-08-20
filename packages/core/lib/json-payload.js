const jsonStringify = require('@bugsnag/safe-json-stringify')
const filterPaths = [
  // report
  'events.[].app',
  'events.[].metaData',
  'events.[].user',
  'events.[].breadcrumbs',
  'events.[].request',
  'events.[].device',
  // session
  'device',
  'app',
  'user'
]

module.exports.report = (report, filterKeys) => {
  let payload = jsonStringify(report, null, null, { filterPaths, filterKeys })
  if (payload.length > 10e5) {
    delete report.events[0].metaData
    report.events[0].metaData = {
      notifier:
`WARNING!
Serialized payload was ${payload.length / 10e5}MB (limit = 1MB)
metaData was removed`
    }
    payload = jsonStringify(report, null, null, { filterPaths, filterKeys })
    if (payload.length > 10e5) throw new Error('payload exceeded 1MB limit')
  }
  return payload
}

module.exports.session = (report, filterKeys) => {
  return jsonStringify(report, null, null, { filterPaths, filterKeys })
}
