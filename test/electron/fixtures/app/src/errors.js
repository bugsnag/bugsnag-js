const Bugsnag = require('@bugsnag/electron')

module.exports = {
  uncaughtException () {
    // eslint-disable-next-line
    foo()
  },

  unhandledRejection () {
    Promise.reject(new TypeError('invalid'))
  },

  crash () {
    process.crash()
  },

  notify () {
    Bugsnag.notify(new ReferenceError('something bad'))
  }
}
