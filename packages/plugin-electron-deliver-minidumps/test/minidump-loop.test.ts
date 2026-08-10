import EventEmitter from 'events'
import Session from '@bugsnag/core/session'
import Breadcrumb from '@bugsnag/core/breadcrumb'
import NetworkStatus from '@bugsnag/electron-network-status'
import MinidumpDeliveryLoop from '../minidump-loop'

// ---------------------------------------------------------------------------
// Timer / promise helpers
// ---------------------------------------------------------------------------

// Flush the microtask queue once (one setImmediate tick)
const flushPromises = () => new Promise(setImmediate)

// Flush deeply enough to drain all chained async calls:
//   setTimeout → _deliverNextMinidump [await peek]
//             → _deliverMinidump [await _readEvent → await readFile]
//             → [await sendMinidump]
//             → _onerror / success path
//             → _scheduleSelf
const flushAll = async () => {
  for (let i = 0; i < 10; i++) {
    await flushPromises()
  }
}

// Fire the next pending timer then drain all microtasks
const stepLoop = async () => {
  jest.runOnlyPendingTimers()
  await flushAll()
}

// Advance time past the maximum possible backoff (60 000 ms),
// then fire the newly-scheduled timer and drain
const advancePastBackoff = async () => {
  jest.advanceTimersByTime(60000)
  await stepLoop()
}

jest.useFakeTimers()

jest.mock('fs', () => ({
  promises: {
    readFile: () => Promise.resolve('{}')
  }
}))

// ---------------------------------------------------------------------------
// Queue helpers
// ---------------------------------------------------------------------------

// One-shot queue: each minidump is returned once then undefined.
// Use for tests where the queue is consumed normally.
const createQueue = (...minidumps) => ({
  peek: minidumps.reduce((fn, md) => fn.mockResolvedValueOnce(md), jest.fn()),
  remove: jest.fn().mockResolvedValue(true)
})

// Persistent queue: always returns the same minidump until remove() is called.
// Use for retry/backoff tests where peek() must keep returning the item.
const createPersistentQueue = (minidump) => {
  let item: any = minidump
  return {
    peek: jest.fn(async () => item),
    remove: jest.fn(async () => { item = null })
  }
}

const createSendMinidump = () => jest.fn().mockResolvedValue(true)

const runDeliveryLoop = async (times: number = 1) => {
  for (let i = 0; i < times; i++) {
    await stepLoop()
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('electron-minidump-delivery: minidump-loop', () => {
  const onSendCallbacks = []
  // info() added because the backoff fix calls this._logger.info(...)
  const logger = {
    error: () => {},
    info: () => {}
  }

  describe('delivers minidumps', () => {
    it('delivers minidumps', async () => {
      const sendMinidump = createSendMinidump()
      const minidumpQueue = createQueue(
        { minidumpPath: 'minidump-path1', eventPath: 'event-path1' },
        { minidumpPath: 'minidump-path2', eventPath: 'event-path2' }
      )

      const loop = new MinidumpDeliveryLoop(sendMinidump, onSendCallbacks, minidumpQueue, logger)
      loop.start()

      await runDeliveryLoop()

      expect(sendMinidump).toHaveBeenCalledTimes(1)
      expect(minidumpQueue.remove).toHaveBeenCalledTimes(1)
    })

    it('sends minidumps with no event', async () => {
      const sendMinidump = createSendMinidump()
      const minidumpQueue = createQueue(
        { minidumpPath: 'minidump-path1' },
        { minidumpPath: 'minidump-path2' }
      )

      const loop = new MinidumpDeliveryLoop(sendMinidump, onSendCallbacks, minidumpQueue, logger)
      loop.start()

      await runDeliveryLoop()

      expect(sendMinidump).toHaveBeenCalledTimes(1)
      expect(minidumpQueue.remove).toHaveBeenCalledTimes(1)
    })
  })

  it('skips events blocked by an on send callback', async () => {
    const sendMinidump = createSendMinidump()
    const minidumpQueue = createQueue(
      { minidumpPath: 'minidump-path1', eventPath: 'event-path1' },
      { minidumpPath: 'minidump-path2', eventPath: 'event-path2' }
    )

    const loop = new MinidumpDeliveryLoop(sendMinidump, () => false, minidumpQueue, logger)
    loop.start()

    await runDeliveryLoop(2)

    expect(sendMinidump).toHaveBeenCalledTimes(0)
    expect(minidumpQueue.remove).toHaveBeenCalledTimes(2)
  })

  it('allows on send callback to mutate the event', async () => {
    const sendMinidump = createSendMinidump()
    const minidumpQueue = createQueue(
      { minidumpPath: 'minidump-path', eventPath: 'event-path' }
    )

    let eventMinidumpPath
    const onSendError = event => {
      event.addMetadata('abc', { x: 1, y: 2 })
      event.addMetadata('abc', 'z', 3)
      event.addMetadata('minidump', { path: event.minidumpPath })

      event.addFeatureFlag('a', 1)
      event.context = 'contextual'
      event.setUser('a', 'b', 'c')
      event.breadcrumbs.push(new Breadcrumb('crumby', { a: 1 }, 'manual', new Date('2020-01-01T00:00:00Z')))

      const session = new Session()
      session.id = 'an session ID'
      session.startedAt = new Date('2020-01-02T00:00:00Z')
      session._handled = 0
      session._unhandled = 1

      event._session = session

      event.groupingHash = 'grouper'
      event.request = { food: 'please' }
      event.severity = 'info'
      event.unhandled = false

      eventMinidumpPath = event.minidumpPath
    }

    const loop = new MinidumpDeliveryLoop(sendMinidump, onSendError, minidumpQueue, logger)
    loop.start()

    await runDeliveryLoop(1)

    expect(sendMinidump).toHaveBeenCalledWith('minidump-path', {
      breadcrumbs: [
        {
          name: 'crumby',
          metaData: { a: 1 },
          type: 'manual',
          timestamp: new Date('2020-01-01T00:00:00Z')
        }
      ],
      context: 'contextual',
      featureFlags: [
        { featureFlag: 'a', variant: '1' }
      ],
      groupingHash: 'grouper',
      metadata: {
        abc: { x: 1, y: 2, z: 3 },
        minidump: { path: 'minidump-path' }
      },
      request: { food: 'please' },
      session: {
        events: { handled: 0, unhandled: 1 },
        id: 'an session ID',
        startedAt: new Date('2020-01-02T00:00:00Z')
      },
      severity: 'info',
      severityReason: { type: 'userCallbackSetSeverity' },
      user: {
        email: 'b',
        id: 'a',
        name: 'c'
      }
    })

    expect(eventMinidumpPath).toBe('minidump-path')

    expect(minidumpQueue.remove).toHaveBeenCalledWith({
      minidumpPath: 'minidump-path',
      eventPath: 'event-path'
    })
  })

  it('stops calling callbacks when an event is blocked by an earlier callback', async () => {
    const sendMinidump = createSendMinidump()
    const minidumpQueue = createQueue(
      { minidumpPath: 'minidump-path1', eventPath: 'event-path1' },
      { minidumpPath: 'minidump-path2', eventPath: 'event-path2' }
    )

    const callbacks = [jest.fn(() => true), jest.fn(() => false), jest.fn(() => true)]

    const loop = new MinidumpDeliveryLoop(sendMinidump, callbacks, minidumpQueue, logger)
    loop.start()

    await runDeliveryLoop(2)

    expect(sendMinidump).toHaveBeenCalledTimes(0)
    expect(minidumpQueue.remove).toHaveBeenCalledTimes(2)

    // the callbacks are called twice as there are two minidumps and are called
    // in order of most recently added -> least recently added
    expect(callbacks[2]).toHaveBeenCalledTimes(2)
    expect(callbacks[1]).toHaveBeenCalledTimes(2)
    expect(callbacks[0]).not.toHaveBeenCalled()
  })

  it('handles callbacks that throw errors', async () => {
    const sendMinidump = createSendMinidump()
    const minidumpQueue = createQueue(
      { minidumpPath: 'minidump-path1', eventPath: 'event-path1' },
      { minidumpPath: 'minidump-path2', eventPath: 'event-path2' }
    )
    const error = new Error('oh no!')

    const callbacks = [
      jest.fn(() => true),
      jest.fn(() => true),
      jest.fn(() => { throw error }),
      jest.fn(() => true)
    ]

    const logError = jest.fn()

    // info() added so the logger is complete for the backoff fix
    const loop = new MinidumpDeliveryLoop(sendMinidump, callbacks, minidumpQueue, { error: logError, info: () => {} })
    loop.start()

    await runDeliveryLoop(2)

    expect(sendMinidump).toHaveBeenCalledTimes(2)
    expect(minidumpQueue.remove).toHaveBeenCalledTimes(2)

    expect(callbacks[3]).toHaveBeenCalledTimes(2)
    expect(callbacks[2]).toHaveBeenCalledTimes(2)
    expect(callbacks[1]).toHaveBeenCalledTimes(2)
    expect(callbacks[0]).toHaveBeenCalledTimes(2)

    // there are two minidumps so the error should be thrown & logged twice
    // each thrown error results in two logs - one for an 'error occurred...'
    // message and one for the error object itself
    expect(logError).toHaveBeenNthCalledWith(1, 'Error occurred in onSendError callback, continuing anyway…')
    expect(logError).toHaveBeenNthCalledWith(2, error)
    expect(logError).toHaveBeenNthCalledWith(3, 'Error occurred in onSendError callback, continuing anyway…')
    expect(logError).toHaveBeenNthCalledWith(4, error)
  })

  it('stops when the queue is exhausted', async () => {
    const sendMinidump = createSendMinidump()
    const minidumpQueue = createQueue(
      { minidumpPath: 'minidump-path1', eventPath: 'event-path1' },
      { minidumpPath: 'minidump-path2', eventPath: 'event-path2' }
    )

    const loop = new MinidumpDeliveryLoop(sendMinidump, onSendCallbacks, minidumpQueue, logger)
    loop.start()

    await runDeliveryLoop(3)

    expect(sendMinidump).toHaveBeenCalledTimes(2)
    expect(minidumpQueue.remove).toHaveBeenCalledTimes(2)

    expect(jest.getTimerCount()).toBe(0)
  })

  // Updated: the second attempt is now delayed by backoff so we advance
  // past BACKOFF_MAX_MS before checking the second delivery.
  it('attempts redelivery', async () => {
    const retryError: any = new Error()
    retryError.isRetryable = true
    const sendMinidump = jest.fn()
      .mockRejectedValueOnce(retryError)
      .mockResolvedValueOnce(true)

    // Use persistent queue so peek() keeps returning the item on retry
    const minidump = { minidumpPath: 'minidump-path1', eventPath: 'event-path1' }
    const minidumpQueue = createPersistentQueue(minidump)

    const loop = new MinidumpDeliveryLoop(sendMinidump, onSendCallbacks, minidumpQueue, logger)
    loop.start()

    // First attempt — fails, schedules retry with backoff
    await stepLoop()
    expect(sendMinidump).toHaveBeenCalledTimes(1)
    expect(minidumpQueue.remove).toHaveBeenCalledTimes(0)

    // Advance past the maximum possible backoff then drain — second attempt succeeds
    await advancePastBackoff()
    expect(sendMinidump).toHaveBeenCalledTimes(2)
    expect(minidumpQueue.remove).toHaveBeenCalledTimes(1)
  })

  describe('watchNetworkStatus', () => {
    const app = { isReady: () => true }
    const emitter = new EventEmitter()

    it('should start delivery only when connected', async () => {
      const statusWatcher = new NetworkStatus({ emitter }, { online: false }, app)

      const sendMinidump = createSendMinidump()
      const minidumpQueue = createQueue(
        { minidumpPath: 'minidump-path1', eventPath: 'event-path1' },
        { minidumpPath: 'minidump-path2', eventPath: 'event-path2' }
      )

      const loop = new MinidumpDeliveryLoop(sendMinidump, onSendCallbacks, minidumpQueue, logger)
      loop.watchNetworkStatus(statusWatcher)

      // ensure that nothing is delivered while disconnected
      await runDeliveryLoop(1)
      expect(sendMinidump).toHaveBeenCalledTimes(0)

      // connect the network
      emitter.emit('MetadataUpdate', { section: 'device', values: { online: true } }, null)

      // check that we've started delivering minidumps
      await runDeliveryLoop(1)
      expect(sendMinidump).toHaveBeenCalledTimes(1)
    })

    it('should stop delivery when disconnected', async () => {
      const statusWatcher = new NetworkStatus({ emitter }, { online: true }, app)

      const sendMinidump = createSendMinidump()
      const minidumpQueue = createQueue(
        { minidumpPath: 'minidump-path1', eventPath: 'event-path1' },
        { minidumpPath: 'minidump-path2', eventPath: 'event-path2' }
      )

      const loop = new MinidumpDeliveryLoop(sendMinidump, onSendCallbacks, minidumpQueue, logger)
      loop.watchNetworkStatus(statusWatcher)

      // ensure that the first minidump is delivered
      await runDeliveryLoop(1)
      expect(sendMinidump).toHaveBeenCalledTimes(1)

      // disconnect the network
      emitter.emit('MetadataUpdate', { section: 'device', values: { online: false } }, null)

      // check that no more minidumps are delivered
      await runDeliveryLoop(2)
      expect(sendMinidump).toHaveBeenCalledTimes(1)
    })
  })

  describe('exponential backoff behaviour', () => {
    it('does not remove minidump from queue on retryable error', async () => {
      // No isRetryable property → treated as retryable by default
      const retryError: any = new Error('net::ERR_NAME_NOT_RESOLVED')

      const sendMinidump = jest.fn().mockRejectedValue(retryError)
      const minidumpQueue = createPersistentQueue(
        { minidumpPath: 'minidump-path1', eventPath: 'event-path1' }
      )

      const loop = new MinidumpDeliveryLoop(sendMinidump, onSendCallbacks, minidumpQueue, logger)
      loop.start()

      await stepLoop()

      expect(minidumpQueue.remove).not.toHaveBeenCalled()

      loop.stop()
    })

    it('removes minidump and resets counter on non-retryable error', async () => {
      const nonRetryableError: any = new Error('Bad status: 400')
      nonRetryableError.isRetryable = false

      const sendMinidump = jest.fn().mockRejectedValue(nonRetryableError)
      const minidumpQueue = createPersistentQueue(
        { minidumpPath: 'minidump-path1', eventPath: 'event-path1' }
      )

      const loop = new MinidumpDeliveryLoop(sendMinidump, onSendCallbacks, minidumpQueue, logger)
      loop.start()

      await stepLoop()

      expect(minidumpQueue.remove).toHaveBeenCalledWith({
        minidumpPath: 'minidump-path1',
        eventPath: 'event-path1'
      })
      expect(loop._failureCount).toBe(0)

      loop.stop()
    })

    it('increments failure count on consecutive retryable failures', async () => {
      const retryError: any = new Error('ECONNREFUSED')
      const sendMinidump = jest.fn().mockRejectedValue(retryError)

      // persistent queue — peek() keeps returning the same item so retries keep firing
      const minidumpQueue = createPersistentQueue(
        { minidumpPath: 'minidump-path1', eventPath: 'event-path1' }
      )

      const loop = new MinidumpDeliveryLoop(sendMinidump, onSendCallbacks, minidumpQueue, logger)
      loop.start()

      // Failure 1 — fire initial timer and drain fully
      await stepLoop()
      expect(loop._failureCount).toBe(1)

      // Failure 2 — advance past backoff cap, fire timer, drain fully
      await advancePastBackoff()
      expect(loop._failureCount).toBe(2)

      // Failure 3
      await advancePastBackoff()
      expect(loop._failureCount).toBe(3)

      loop.stop()
    })

    it('resets failure count to 0 after a successful delivery', async () => {
      const retryError: any = new Error('ETIMEDOUT')
      let callCount = 0

      const sendMinidump = jest.fn().mockImplementation(async () => {
        callCount++
        if (callCount === 1) throw retryError
        // second call succeeds
      })

      // persistent queue — keeps returning item until remove() is called on success
      const minidumpQueue = createPersistentQueue(
        { minidumpPath: 'minidump-path1', eventPath: 'event-path1' }
      )

      const loop = new MinidumpDeliveryLoop(sendMinidump, onSendCallbacks, minidumpQueue, logger)
      loop.start()

      // First attempt fails — fire timer and drain fully
      await stepLoop()
      expect(loop._failureCount).toBe(1)

      // Advance past backoff — second attempt succeeds, drain fully
      await advancePastBackoff()
      expect(loop._failureCount).toBe(0)
      expect(minidumpQueue.remove).toHaveBeenCalledTimes(1)

      loop.stop()
    })

    it('caps backoff delay at BACKOFF_MAX_MS even after many failures', async () => {
      const retryError: any = new Error('ENETUNREACH')
      const sendMinidump = jest.fn().mockRejectedValue(retryError)

      // persistent queue — keeps returning item so all 10 retries fire
      const minidumpQueue = createPersistentQueue(
        { minidumpPath: 'minidump-path1', eventPath: 'event-path1' }
      )

      // Pin Math.random to 0.9999 so we always get near-maximum delay
      const mockRandom = jest.spyOn(Math, 'random').mockReturnValue(0.9999)

      const loop = new MinidumpDeliveryLoop(sendMinidump, onSendCallbacks, minidumpQueue, logger)
      loop.start()

      // Failure 1 — fire initial timer
      await stepLoop()
      expect(loop._failureCount).toBe(1)

      // Failures 2–10 — each time advance past cap, fire timer, drain
      for (let i = 2; i <= 10; i++) {
        await advancePastBackoff()
        expect(loop._failureCount).toBe(i)
      }

      // After 10 failures the timer must still fire within BACKOFF_MAX_MS
      await advancePastBackoff()
      expect(loop._failureCount).toBe(11)

      loop.stop()
      mockRandom.mockRestore()
    })

    it('calculates expected backoff values', () => {
      const { calculateBackoff } = require('../minidump-loop')

      const mockRandom = jest.spyOn(Math, 'random').mockReturnValue(0.5)

      // failureCount=1 → min(1000*2^1, 60000)=2000 → floor(0.5*2000)=1000
      expect(calculateBackoff(1)).toBe(1000)

      // failureCount=2 → min(1000*2^2, 60000)=4000 → floor(0.5*4000)=2000
      expect(calculateBackoff(2)).toBe(2000)

      // failureCount=3 → min(1000*2^3, 60000)=8000 → floor(0.5*8000)=4000
      expect(calculateBackoff(3)).toBe(4000)

      // failureCount=10 → min(1000*2^10, 60000)=60000 → floor(0.5*60000)=30000
      expect(calculateBackoff(10)).toBe(30000)

      // failureCount=100 → still capped → floor(0.5*60000)=30000
      expect(calculateBackoff(100)).toBe(30000)

      mockRandom.mockRestore()
    })

    it('resets failure count when loop is restarted via network reconnection', async () => {
      const app = { isReady: () => true }
      const emitter = new EventEmitter()
      const statusWatcher = new NetworkStatus({ emitter }, { online: true }, app)

      const retryError: any = new Error('ENETUNREACH')
      const sendMinidump = jest.fn().mockRejectedValue(retryError)
      const minidumpQueue = createPersistentQueue(
        { minidumpPath: 'minidump-path1', eventPath: 'event-path1' }
      )

      const loop = new MinidumpDeliveryLoop(sendMinidump, onSendCallbacks, minidumpQueue, logger)
      loop.watchNetworkStatus(statusWatcher)

      // Fail once to increment counter
      await stepLoop()
      expect(loop._failureCount).toBe(1)

      // Simulate network disconnect → reconnect — start() resets _failureCount
      emitter.emit('MetadataUpdate', { section: 'device', values: { online: false } }, null)
      emitter.emit('MetadataUpdate', { section: 'device', values: { online: true } }, null)

      expect(loop._failureCount).toBe(0)

      loop.stop()
    })

    it('does not retry at full speed when endpoint is unreachable', async () => {
      const retryError: any = new Error('ECONNREFUSED')
      const sendMinidump = jest.fn().mockRejectedValue(retryError)
      const minidumpQueue = createPersistentQueue(
        { minidumpPath: 'minidump-path1', eventPath: 'event-path1' }
      )

      const loop = new MinidumpDeliveryLoop(sendMinidump, onSendCallbacks, minidumpQueue, logger)
      loop.start()

      // First attempt fails
      await stepLoop()
      expect(sendMinidump).toHaveBeenCalledTimes(1)

      // Advance only 500ms — less than BACKOFF_BASE_MS (1000ms minimum)
      // No retry should have fired yet
      jest.advanceTimersByTime(500)
      await flushAll()
      expect(sendMinidump).toHaveBeenCalledTimes(1)

      loop.stop()
    })
  })
})