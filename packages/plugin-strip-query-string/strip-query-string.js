/*
 * Remove query strings (and fragments) from stacktraces
 */
const { map, reduce } = require('@bugsnag/core/lib/es-utils')

module.exports = {
  init: (client) => {
    client.addOnError(event => {
      const allFrames = reduce(event.errors, (accum, er) => accum.concat(er.stacktrace), [])
      map(allFrames, frame => {
        frame.file = strip(frame.file)
      })
    })
  }
}

const strip = module.exports._strip = str =>
  typeof str === 'string'
    ? str.replace(/\?.*$/, '').replace(/#.*$/, '')
    : str
