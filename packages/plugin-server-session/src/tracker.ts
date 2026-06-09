import { Session } from '@bugsnag/core'
import EventEmitter from 'events'
import { DEFAULT_SUMMARY_INTERVAL } from './constants'

type SessionSummary = Array<{ startedAt: string, sessionsStarted: number }>

const hasUnref = (value: unknown): value is { unref: () => void } => {
  return typeof value === 'object' && value !== null && typeof (value as { unref?: unknown }).unref === 'function'
}

class SessionTracker extends EventEmitter {
  private _sessions: Map<string, number>
  private _interval: ReturnType<typeof setInterval> | null
  private _intervalLength: number

  constructor (intervalLength?: number) {
    super()
    this._sessions = new Map()
    this._interval = null
    this._intervalLength = intervalLength ?? DEFAULT_SUMMARY_INTERVAL

    this._summarize = this._summarize.bind(this)
  }

  start (): void {
    if (!this._interval) {
      const interval = setInterval(this._summarize, this._intervalLength)

      // In non-Node runtimes (e.g. Cloudflare Workers) setInterval returns a number.
      if (hasUnref(interval)) {
        interval.unref()
      }

      this._interval = interval
    }
  }

  stop (): void {
    if (this._interval !== null) {
      clearInterval(this._interval)
    }
    this._interval = null
  }

  track (session: Session): Session {
    const key = dateToMsKey(session.startedAt)
    const cur = this._sessions.get(key)
    this._sessions.set(key, cur === null || cur === undefined ? 1 : cur + 1)
    return session
  }

  _summarize (): void {
    const summary: SessionSummary = []
    this._sessions.forEach((val, key) => {
      summary.push({ startedAt: key, sessionsStarted: val })
      this._sessions.delete(key)
    })
    if (!summary.length) return
    this.emit('summary', summary)
  }
}

const dateToMsKey = (d: Date): string => {
  const dk = new Date(d)
  dk.setSeconds(0)
  dk.setMilliseconds(0)
  return dk.toISOString()
}

export default SessionTracker