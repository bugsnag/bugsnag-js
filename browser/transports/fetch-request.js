const jsonStringify = require('@bugsnag/safe-json-stringify')
const makePayload = require('./lib/payload')
const {
  isoDate
} = require('../../base/lib/es-utils')
const getScope = require('../scope')

module.exports = {
  name: 'fetch',
  sendReport (logger, config, report, cb = () => {}) {
    const scope = getScope()
    const url = config.endpoint

    scope.fetch(url, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'Bugsnag-Api-Key': report.apiKey || config.apiKey,
        'Bugsnag-Payload-Version': '4.0',
        'Bugsnag-Sent-At': isoDate()
      },
      body: makePayload(report)
    }).then(response => response.text()).then(text => {
      cb(null, text)
    }).catch(e => {
      logger.error(e)
    })
  },
  sendSession (logger, config, session, cb = () => {}) {
    const scope = getScope()
    const url = config.endpoint

    scope.fetch(url, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'Bugsnag-Api-Key': config.apiKey,
        'Bugsnag-Payload-Version': '1.0',
        'Bugsnag-Sent-At': isoDate()
      },
      body: jsonStringify(session)
    }).then(response => response.text()).then(text => {
      cb(null, text)
    }).catch(e => {
      logger.error(e)
    })
  }
}
