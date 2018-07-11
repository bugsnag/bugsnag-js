const { isoDate } = require('./lib/es-utils')
const cuid = require('@bugsnag/cuid')

class Session {
  constructor () {
    this.id = cuid()
    this.startedAt = isoDate()
    this._handled = 0
    this._unhandled = 0
  }
  toJSON () {
    return {
      id: this.id,
      startedAt: this.startedAt,
      events: { handled: this._handled, unhandled: this._unhandled }
    }
  }
  trackError (report) {
    this[report._handledState.unhandled ? '_unhandled' : '_handled'] += 1
  }
}

module.exports = Session
