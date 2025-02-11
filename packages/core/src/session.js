const cuid = require('@bugsnag/cuid')

class Session {
  constructor () {
    this.id = cuid()
    this.startedAt = new Date()
    this._handled = 0
    this._unhandled = 0
    this._user = {}
    this.app = {}
    this.device = {}
  }

  getUser () {
    return this._user
  }

  setUser (id, email, name) {
    this._user = { id, email, name }
  }

  toJSON () {
    return {
      id: this.id,
      startedAt: this.startedAt,
      events: { handled: this._handled, unhandled: this._unhandled }
    }
  }

  _track (event) {
    this[event._handledState.unhandled ? '_unhandled' : '_handled'] += 1
  }
}

module.exports = Session
