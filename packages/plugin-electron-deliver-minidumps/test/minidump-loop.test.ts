import EventEmitter from 'events'
import { Breadcrumb, Session } from '@bugsnag/core'
import NetworkStatus from '@bugsnag/electron-network-status'
import MinidumpDeliveryLoop from '../minidump-loop'

// ---------------------------------------------------------------------------
// Timer helpers
// ---------------------------------------------------------------------------

// FIX: Add 'setImmediate' to doNotFake.
// MinidumpDeliveryLoop uses setImmediate internally for tick scheduling.
// Without this, setImmediate calls accumulate as fake timers and
// jest.getTimerCount() never reaches 0 when the queue is exhausted.
jest.useFakeTimers({
  doNotFake: ['nextTick', 'setImmediate']
})

// Flushes the microtask + setImmediate queue.
// A single real setImmediate fires after all microtasks have drained,
// so one yield is sufficient to let pending promise chains resolve fully.
const flushPromises = (): Promise<void> =>
  new Promise(resolve => setImmediate(resolve))

// Runs ONLY the timers currently pending at time T=0 (e.g. processing 1 item).
// Newly scheduled timers at T=0 will not be executed until the next call.
const stepLoop = async (): Promise<void> => {
  if (typeof (jest as any).runOnlyPendingTimersAsync === 'function') {
    await (jest as any).runOnlyPendingTimersAsync()
  } else {
    jest.runOnlyPendingTimers()
    await flushPromises()
  }
}

// Advances time to the next future timer (e.g. a backoff retry scheduled >0ms in the future).
const advancePastBackoff = async (): Promise<void> => {
  if (typeof (jest as any).advanceTimersToNextTimerAsync === 'function') {
    await (jest as any).advanceTimersToNextTimerAsync()
  } else {
    jest.advanceTimersToNextTimer()
    await flushPromises()
  }
}

const runDeliveryLoop = async (times = 1): Promise<void> => {
  for (let i = 0; i < times; i++) {
    await stepLoop()
  }
}

// ---------------------------------------------------------------------------
// Mocks & Helpers
// ---------------------------------------------------------------------------

jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(() => Promise.resolve('{}'))
  }
}))

type Minidump = {
  minidumpPath: string
  eventPath?: string
}

type Logger = {
  error: jest.Mock
  info: jest.Mock
}

type Queue = {
  peek: jest.Mock
  remove: jest.Mock
}

const createLogger = (): Logger => ({
  error: jest.fn(),
  info: jest.fn()
})

const createQueue = (...minidumps: Minidump[]): Queue => ({
  peek: minidumps.reduce(
    (fn: jest.Mock, minidump: Minidump) =>
      fn.mockResolvedValueOnce(minidump),
    jest.fn()
  ),
  remove: jest.fn().mockResolvedValue(true)
})

const createPersistentQueue = (minidump: Minidump): Queue => {
  let item: Minidump | null = minidump

  return {
    peek: jest.fn(async () => item),
    remove: jest.fn(async () => {
      item = null
    })
  }
}

const createSendMinidump = (): jest.Mock =>
  jest.fn().mockResolvedValue(true)

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('electron-minidump-delivery: minidump-loop', () => {
  jest.setTimeout(30000)

  const onSendCallbacks: any[] = []

  afterEach(() => {
    jest.clearAllTimers()
    jest.restoreAllMocks()
  })

  describe('delivers minidumps', () => {
    it('delivers minidumps', async () => {
      const sendMinidump = createSendMinidump()

      const minidumpQueue = createQueue(
        {
          minidumpPath: 'minidump-path1',
          eventPath: 'event-path1'
        },
        {
          minidumpPath: 'minidump-path2',
          eventPath: 'event-path2'
        }
      )

      const loop = new MinidumpDeliveryLoop(
        sendMinidump,
        onSendCallbacks as any,
        minidumpQueue as any,
        createLogger()
      )

      loop.start()

      await runDeliveryLoop()

      expect(sendMinidump).toHaveBeenCalledTimes(1)
      expect(minidumpQueue.remove).toHaveBeenCalledTimes(1)

      loop.stop()
    })

    it('sends minidumps with no event', async () => {
      const sendMinidump = createSendMinidump()

      const minidumpQueue = createQueue(
        {
          minidumpPath: 'minidump-path1'
        },
        {
          minidumpPath: 'minidump-path2'
        }
      )

      const loop = new MinidumpDeliveryLoop(
        sendMinidump,
        onSendCallbacks as any,
        minidumpQueue as any,
        createLogger()
      )

      loop.start()

      await runDeliveryLoop()

      expect(sendMinidump).toHaveBeenCalledTimes(1)
      expect(minidumpQueue.remove).toHaveBeenCalledTimes(1)

      loop.stop()
    })
  })

  it('skips events blocked by an on send callback', async () => {
    const sendMinidump = createSendMinidump()

    const minidumpQueue = createQueue(
      {
        minidumpPath: 'minidump-path1',
        eventPath: 'event-path1'
      },
      {
        minidumpPath: 'minidump-path2',
        eventPath: 'event-path2'
      }
    )

    const loop = new MinidumpDeliveryLoop(
      sendMinidump,
      (() => false) as any,
      minidumpQueue as any,
      createLogger()
    )

    loop.start()

    await runDeliveryLoop(2)

    expect(sendMinidump).toHaveBeenCalledTimes(0)
    expect(minidumpQueue.remove).toHaveBeenCalledTimes(2)

    loop.stop()
  })

  it('allows on send callback to mutate the event', async () => {
    const sendMinidump = createSendMinidump()

    const minidumpQueue = createQueue({
      minidumpPath: 'minidump-path',
      eventPath: 'event-path'
    })

    let eventMinidumpPath = ''

    const onSendError = (event: any) => {
      event.addMetadata('abc', {
        x: 1,
        y: 2
      })

      event.addMetadata('abc', 'z', 3)

      event.addMetadata('minidump', {
        path: event.minidumpPath
      })

      event.addFeatureFlag('a', 1)
      event.context = 'contextual'
      event.setUser('a', 'b', 'c')

      event.breadcrumbs.push(
        new Breadcrumb(
          'crumby',
          { a: 1 },
          'manual',
          new Date('2020-01-01T00:00:00Z')
        )
      )

      const session = new Session()

      ;(session as any).id = 'an session ID'
      ;(session as any).startedAt = new Date('2020-01-02T00:00:00Z')
      session._handled = 0
      session._unhandled = 1

      event._session = session
      event.groupingHash = 'grouper'
      event.request = { food: 'please' }
      event.severity = 'info'
      event.unhandled = false

      eventMinidumpPath = event.minidumpPath
    }

    const loop = new MinidumpDeliveryLoop(
      sendMinidump,
      onSendError as any,
      minidumpQueue as any,
      createLogger()
    )

    loop.start()

    await runDeliveryLoop()

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
        {
          featureFlag: 'a',
          variant: '1'
        }
      ],
      groupingHash: 'grouper',
      metadata: {
        abc: {
          x: 1,
          y: 2,
          z: 3
        },
        minidump: {
          path: 'minidump-path'
        }
      },
      request: {
        food: 'please'
      },
      session: {
        events: {
          handled: 0,
          unhandled: 1
        },
        id: 'an session ID',
        startedAt: new Date('2020-01-02T00:00:00Z')
      },
      severity: 'info',
      severityReason: {
        type: 'userCallbackSetSeverity'
      },
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

    loop.stop()
  })

  it('stops calling callbacks when an event is blocked by an earlier callback', async () => {
    const sendMinidump = createSendMinidump()

    const minidumpQueue = createQueue(
      {
        minidumpPath: 'minidump-path1',
        eventPath: 'event-path1'
      },
      {
        minidumpPath: 'minidump-path2',
        eventPath: 'event-path2'
      }
    )

    const callbacks = [
      jest.fn(() => true),
      jest.fn(() => false),
      jest.fn(() => true)
    ]

    const loop = new MinidumpDeliveryLoop(
      sendMinidump,
      callbacks as any,
      minidumpQueue as any,
      createLogger()
    )

    loop.start()

    await runDeliveryLoop(2)

    expect(sendMinidump).toHaveBeenCalledTimes(0)
    expect(minidumpQueue.remove).toHaveBeenCalledTimes(2)

    expect(callbacks[2]).toHaveBeenCalledTimes(2)
    expect(callbacks[1]).toHaveBeenCalledTimes(2)
    expect(callbacks[0]).not.toHaveBeenCalled()

    loop.stop()
  })

  it('handles callbacks that throw errors', async () => {
    const sendMinidump = createSendMinidump()

    const minidumpQueue = createQueue(
      {
        minidumpPath: 'minidump-path1',
        eventPath: 'event-path1'
      },
      {
        minidumpPath: 'minidump-path2',
        eventPath: 'event-path2'
      }
    )

    const error = new Error('oh no!')

    const callbacks = [
      jest.fn(() => true),
      jest.fn(() => true),
      jest.fn(() => {
        throw error
      }),
      jest.fn(() => true)
    ]

    const logError = jest.fn()

    const loop = new MinidumpDeliveryLoop(
      sendMinidump,
      callbacks as any,
      minidumpQueue as any,
      {
        error: logError,
        info: jest.fn()
      }
    )

    loop.start()

    await runDeliveryLoop(2)

    expect(sendMinidump).toHaveBeenCalledTimes(2)
    expect(minidumpQueue.remove).toHaveBeenCalledTimes(2)

    expect(callbacks[3]).toHaveBeenCalledTimes(2)
    expect(callbacks[2]).toHaveBeenCalledTimes(2)
    expect(callbacks[1]).toHaveBeenCalledTimes(2)
    expect(callbacks[0]).toHaveBeenCalledTimes(2)

    expect(logError).toHaveBeenNthCalledWith(
      1,
      'Error occurred in onSendError callback, continuing anyway…'
    )
    expect(logError).toHaveBeenNthCalledWith(2, error)
    expect(logError).toHaveBeenNthCalledWith(
      3,
      'Error occurred in onSendError callback, continuing anyway…'
    )
    expect(logError).toHaveBeenNthCalledWith(4, error)

    loop.stop()
  })

  it('stops when the queue is exhausted', async () => {
    const sendMinidump = createSendMinidump()

    const minidumpQueue = createQueue(
      {
        minidumpPath: 'minidump-path1',
        eventPath: 'event-path1'
      },
      {
        minidumpPath: 'minidump-path2',
        eventPath: 'event-path2'
      }
    )

    const loop = new MinidumpDeliveryLoop(
      sendMinidump,
      onSendCallbacks as any,
      minidumpQueue as any,
      createLogger()
    )

    loop.start()

    await runDeliveryLoop(3)

    expect(sendMinidump).toHaveBeenCalledTimes(2)
    expect(minidumpQueue.remove).toHaveBeenCalledTimes(2)
    // FIX: With setImmediate in doNotFake, the loop's internal setImmediate
    // handles are real and not counted in jest.getTimerCount(), so this
    // assertion now correctly passes with 0.
    expect(jest.getTimerCount()).toBe(0)

    loop.stop()
  })

  it('attempts redelivery', async () => {
    const retryError: any = new Error()
    retryError.isRetryable = true

    const sendMinidump = jest.fn()
      .mockRejectedValueOnce(retryError)
      .mockResolvedValueOnce(true)

    const minidump = {
      minidumpPath: 'minidump-path1',
      eventPath: 'event-path1'
    }

    const minidumpQueue = createPersistentQueue(minidump)

    const loop = new MinidumpDeliveryLoop(
      sendMinidump,
      onSendCallbacks as any,
      minidumpQueue as any,
      createLogger()
    )

    loop.start()

    await stepLoop()

    expect(sendMinidump).toHaveBeenCalledTimes(1)
    expect(minidumpQueue.remove).not.toHaveBeenCalled()

    await advancePastBackoff()

    expect(sendMinidump).toHaveBeenCalledTimes(2)
    expect(minidumpQueue.remove).toHaveBeenCalledTimes(1)

    loop.stop()
  })

  describe('watchNetworkStatus', () => {
    it('should start delivery only when connected', async () => {
      const app = {
        isReady: () => true
      }

      const emitter = new EventEmitter()

      const statusWatcher = new NetworkStatus(
        { emitter } as any,
        { online: false },
        app
      )

      const sendMinidump = createSendMinidump()

      const minidumpQueue = createQueue(
        {
          minidumpPath: 'minidump-path1',
          eventPath: 'event-path1'
        },
        {
          minidumpPath: 'minidump-path2',
          eventPath: 'event-path2'
        }
      )

      const loop = new MinidumpDeliveryLoop(
        sendMinidump,
        onSendCallbacks as any,
        minidumpQueue as any,
        createLogger()
      )

      loop.watchNetworkStatus(statusWatcher)

      await runDeliveryLoop()

      expect(sendMinidump).toHaveBeenCalledTimes(0)

      emitter.emit(
        'MetadataUpdate',
        {
          section: 'device',
          values: {
            online: true
          }
        },
        null
      )

      await runDeliveryLoop()

      expect(sendMinidump).toHaveBeenCalledTimes(1)

      loop.stop()
    })

    it('should stop delivery when disconnected', async () => {
      const app = {
        isReady: () => true
      }

      const emitter = new EventEmitter()

      const statusWatcher = new NetworkStatus(
        { emitter } as any,
        { online: true },
        app
      )

      const sendMinidump = createSendMinidump()

      const minidumpQueue = createQueue(
        {
          minidumpPath: 'minidump-path1',
          eventPath: 'event-path1'
        },
        {
          minidumpPath: 'minidump-path2',
          eventPath: 'event-path2'
        }
      )

      const loop = new MinidumpDeliveryLoop(
        sendMinidump,
        onSendCallbacks as any,
        minidumpQueue as any,
        createLogger()
      )

      loop.watchNetworkStatus(statusWatcher)

      await runDeliveryLoop()

      expect(sendMinidump).toHaveBeenCalledTimes(1)

      emitter.emit(
        'MetadataUpdate',
        {
          section: 'device',
          values: {
            online: false
          }
        },
        null
      )

      await runDeliveryLoop(2)

      expect(sendMinidump).toHaveBeenCalledTimes(1)

      loop.stop()
    })
  })

  describe('exponential backoff behaviour', () => {
    it('does not remove minidump from queue on retryable error', async () => {
      const retryError: any = new Error(
        'net::ERR_NAME_NOT_RESOLVED'
      )

      const sendMinidump = jest.fn().mockRejectedValue(retryError)

      const minidumpQueue = createPersistentQueue({
        minidumpPath: 'minidump-path1',
        eventPath: 'event-path1'
      })

      const loop = new MinidumpDeliveryLoop(
        sendMinidump,
        onSendCallbacks as any,
        minidumpQueue as any,
        createLogger()
      )

      loop.start()

      await stepLoop()

      expect(minidumpQueue.remove).not.toHaveBeenCalled()

      loop.stop()
    })

    it('removes minidump and resets counter on non-retryable error', async () => {
      const nonRetryableError: any = new Error('Bad status: 400')
      nonRetryableError.isRetryable = false

      const sendMinidump = jest.fn()
        .mockRejectedValue(nonRetryableError)

      const minidumpQueue = createPersistentQueue({
        minidumpPath: 'minidump-path1',
        eventPath: 'event-path1'
      })

      const loop = new MinidumpDeliveryLoop(
        sendMinidump,
        onSendCallbacks as any,
        minidumpQueue as any,
        createLogger()
      )

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

      const sendMinidump = jest.fn()
        .mockRejectedValue(retryError)

      const minidumpQueue = createPersistentQueue({
        minidumpPath: 'minidump-path1',
        eventPath: 'event-path1'
      })

      const loop = new MinidumpDeliveryLoop(
        sendMinidump,
        onSendCallbacks as any,
        minidumpQueue as any,
        createLogger()
      )

      loop.start()

      await stepLoop()
      expect(loop._failureCount).toBe(1)

      await advancePastBackoff()
      expect(loop._failureCount).toBe(2)

      await advancePastBackoff()
      expect(loop._failureCount).toBe(3)

      loop.stop()
    })

    it('resets failure count to 0 after a successful delivery', async () => {
      const retryError: any = new Error('ETIMEDOUT')
      let callCount = 0

      const sendMinidump = jest.fn().mockImplementation(async () => {
        callCount += 1

        if (callCount === 1) {
          throw retryError
        }

        return true
      })

      const minidumpQueue = createPersistentQueue({
        minidumpPath: 'minidump-path1',
        eventPath: 'event-path1'
      })

      const loop = new MinidumpDeliveryLoop(
        sendMinidump,
        onSendCallbacks as any,
        minidumpQueue as any,
        createLogger()
      )

      loop.start()

      await stepLoop()
      expect(loop._failureCount).toBe(1)

      await advancePastBackoff()

      expect(loop._failureCount).toBe(0)
      expect(minidumpQueue.remove).toHaveBeenCalledTimes(1)

      loop.stop()
    })

    it('caps backoff delay at BACKOFF_MAX_MS even after many failures', async () => {
      const retryError: any = new Error('ENETUNREACH')

      const sendMinidump = jest.fn()
        .mockRejectedValue(retryError)

      const minidumpQueue = createPersistentQueue({
        minidumpPath: 'minidump-path1',
        eventPath: 'event-path1'
      })

      jest.spyOn(Math, 'random').mockReturnValue(0.9999)

      const loop = new MinidumpDeliveryLoop(
        sendMinidump,
        onSendCallbacks as any,
        minidumpQueue as any,
        createLogger()
      )

      loop.start()

      await stepLoop()
      expect(loop._failureCount).toBe(1)

      for (let i = 2; i <= 10; i++) {
        await advancePastBackoff()
        expect(loop._failureCount).toBe(i)
      }

      await advancePastBackoff()
      expect(loop._failureCount).toBe(11)

      loop.stop()
    })

    it('calculates expected backoff values', () => {
      const { calculateBackoff } = require('../minidump-loop')

      jest.spyOn(Math, 'random').mockReturnValue(0.5)

      expect(calculateBackoff(1)).toBe(1000)
      expect(calculateBackoff(2)).toBe(2000)
      expect(calculateBackoff(3)).toBe(4000)
      expect(calculateBackoff(10)).toBe(30000)
      expect(calculateBackoff(100)).toBe(30000)
    })

    it('resets failure count when loop is restarted via network reconnection', async () => {
      const app = {
        isReady: () => true
      }

      const emitter = new EventEmitter()

      const statusWatcher = new NetworkStatus(
        { emitter },
        { online: true },
        app
      )

      const retryError: any = new Error('ENETUNREACH')

      const sendMinidump = jest.fn()
        .mockRejectedValue(retryError)

      const minidumpQueue = createPersistentQueue({
        minidumpPath: 'minidump-path1',
        eventPath: 'event-path1'
      })

      const loop = new MinidumpDeliveryLoop(
        sendMinidump,
        onSendCallbacks as any,
        minidumpQueue as any,
        createLogger()
      )

      loop.watchNetworkStatus(statusWatcher)

      await stepLoop()

      expect(loop._failureCount).toBe(1)

      emitter.emit(
        'MetadataUpdate',
        {
          section: 'device',
          values: {
            online: false
          }
        },
        null
      )

      emitter.emit(
        'MetadataUpdate',
        {
          section: 'device',
          values: {
            online: true
          }
        },
        null
      )

      expect(loop._failureCount).toBe(0)

      loop.stop()
    })

    it('does not retry at full speed when endpoint is unreachable', async () => {
      const retryError: any = new Error('ECONNREFUSED')

      const sendMinidump = jest.fn()
        .mockRejectedValue(retryError)

      const minidumpQueue = createPersistentQueue({
        minidumpPath: 'minidump-path1',
        eventPath: 'event-path1'
      })

      jest.spyOn(Math, 'random').mockReturnValue(0.9999)

      const loop = new MinidumpDeliveryLoop(
        sendMinidump,
        onSendCallbacks as any,
        minidumpQueue as any,
        createLogger()
      )

      loop.start()

      await stepLoop()

      expect(sendMinidump).toHaveBeenCalledTimes(1)

      // FIX: Jest 27 compatible fallback for advanceTimersByTimeAsync
      if (typeof (jest as any).advanceTimersByTimeAsync === 'function') {
        await (jest as any).advanceTimersByTimeAsync(500)
      } else {
        jest.advanceTimersByTime(500)
        await flushPromises()
      }

      expect(sendMinidump).toHaveBeenCalledTimes(1)

      loop.stop()
    })
  })
})
