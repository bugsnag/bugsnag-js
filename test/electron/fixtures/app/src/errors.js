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
  },

  oversizedNotify () {
    function repeat (s, n) {
      var a = []
      while (a.length < n) {
        a.push(s)
      }
      return a.join('')
    }

    var big = {}
    var i = 0
    while (JSON.stringify(big).length < 2 * 10e5) {
      big['entry' + i] = repeat('long repetitive string', 1000)
      i++
    }
    Bugsnag.leaveBreadcrumb('big thing', big)
    Bugsnag.notify(new Error('oversized'))
  }
}
