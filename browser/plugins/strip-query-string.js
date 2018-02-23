/*
 * Remove query strings (and fragments) from stacktraces
 */
const { map } = require('../../base/lib/es-utils')

module.exports = {
  init: (client) => {
    client.config.beforeSend.push(report => {
      report.stacktrace = map(report.stacktrace, frame => ({ ...frame, file: strip(frame.file) }))
    })
  }
}

const strip = module.exports._strip = str =>
  typeof str === 'string'
    ? str.replace(/\?.*$/, '').replace(/#.*$/, '')
    : str
