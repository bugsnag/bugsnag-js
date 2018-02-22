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

const strip = module.exports._strip = maybeUrl => {
  const a = document.createElement('A')
  a.href = maybeUrl
  return (a.search || a.hash) ? `${a.protocol}//${a.host}${a.pathname}` : maybeUrl
}
