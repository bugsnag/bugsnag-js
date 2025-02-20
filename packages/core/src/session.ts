import cuid from '@bugsnag/cuid'
import { App, Device, User } from './common'

interface MinimalEvent {
  _handledState: {
    unhandled: boolean
  }
}

export default class Session {
  constructor (
    private readonly id: string = cuid(),
    private readonly startedAt: Date = new Date(),
    public _handled = 0,
    public _unhandled = 0,
    public _user: User = {},
    public app: App = {},
    private readonly device: Device = {}
  ) { }

  getUser () {
    return this._user
  }

  setUser (id?: string, email?: string, name?: string) {
    this._user = { id, email, name }
  }

  toJSON () {
    return {
      id: this.id,
      startedAt: this.startedAt,
      events: { handled: this._handled, unhandled: this._unhandled }
    }
  }

  _track (event: MinimalEvent) {
    this[event._handledState.unhandled ? '_unhandled' : '_handled'] += 1
  }
}
