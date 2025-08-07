import { Session } from '@bugsnag/core'
import EventEmitter from 'events'

const DEFAULT_SUMMARY_INTERVAL = 10 * 1000

class SessionTracker extends EventEmitter {
  private _sessions: Map<string, number>
  public _interval: NodeJS.Timeout | null
  private _intervalLength: number

  constructor (intervalLength: number) {
    super()
    this._sessions = new Map()
    this._interval = null
    this._intervalLength = intervalLength || DEFAULT_SUMMARY_INTERVAL

    this._summarize = this._summarize.bind(this)
  }

  start () {
    if (!this._interval) {
      this._interval = setInterval(this._summarize, this._intervalLength).unref()
    }
  }

  stop () {
    if (this._interval !== null) {
      clearInterval(this._interval)
    }
    this._interval = null
  }

  track (session: Session) {
    const key = dateToMsKey(session.startedAt)
    const cur = this._sessions.get(key)
    this._sessions.set(key, typeof cur === 'undefined' ? 1 : cur + 1)
    return session
  }

  _summarize () {
    const summary: Array<{ startedAt: string, sessionsStarted: number }> = []
    this._sessions.forEach((val, key) => {
      summary.push({ startedAt: key, sessionsStarted: val })
      this._sessions.delete(key)
    })
    if (!summary.length) return
    this.emit('summary', summary)
  }
}

const dateToMsKey = (d: Date) => {
  const dk = new Date(d)
  dk.setSeconds(0)
  dk.setMilliseconds(0)
  return dk.toISOString()
}

export default SessionTracker