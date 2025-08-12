import { Session } from '@bugsnag/core'
import timekeeper from 'timekeeper'
import Tracker from '../src/tracker'

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
    jest.useFakeTimers()
    const t = new Tracker(100)
    let summaryEmissionCount = 0
    
    t.track(new Session())
    t.track(new Session())
    
    t.on('summary', () => {
      summaryEmissionCount++
    })

    t.start()
    t.start()
    t.start()

    jest.advanceTimersByTime(100)
    expect(summaryEmissionCount).toBe(1)
    
    t.track(new Session())
    jest.advanceTimersByTime(100)
    expect(summaryEmissionCount).toBe(2)
    
    t.stop()
    t.track(new Session())
    jest.advanceTimersByTime(200)
    expect(summaryEmissionCount).toBe(2)
    
    jest.useRealTimers()
  })

  afterEach(() => timekeeper.reset())
})
