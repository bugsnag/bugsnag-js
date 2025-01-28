import Session from '../types/session'

interface MinimalEvent {
  _handledState: {
    unhandled: boolean
  }
}

interface SessionJson {
  id: string
  startedAt: Date
  events: {
    handled: number
    unhandled: number
  }
}

export default class SessionWithInternals extends Session {
  _track(event: MinimalEvent): void
  toJSON(): SessionJson

  public _handled: number
  public _unhandled: number
}
