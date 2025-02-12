import Tracker from '../tracker'
import { Session } from '@bugsnag/core'
import timekeeper from 'timekeeper'

describe('session tracker', () => {
  it('should track sessions and summarize per minute', done => {
    const startOfThisMin = new Date()
    startOfThisMin.setSeconds(0)
    startOfThisMin.setMilliseconds(0)

    timekeeper.travel(startOfThisMin)

    const t = new Tracker(50)
    t.start()
    t.track(new Session())
    t.track(new Session())
    t.track(new Session())
    t.track(new Session())

    timekeeper.travel(startOfThisMin.getTime() + (61 * 1000))

    t.on('summary', function (s) {
      expect(s.length).toBe(1)
      expect(s[0].sessionsStarted).toBe(4)
      expect(s[0].startedAt).toBe(startOfThisMin.toISOString())
      done()
    })
  })

  it('should only start one interval', () => {
    const t = new Tracker(5)
    t.start()
    const i0 = t._interval
    t.start()
    expect(i0).toBe(t._interval)
    t.stop()
    expect(t._interval).toBe(null)
  })

  afterEach(() => timekeeper.reset())
})
