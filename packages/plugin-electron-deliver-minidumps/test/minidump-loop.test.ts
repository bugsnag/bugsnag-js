import EventEmitter from 'events'
import Session from '@bugsnag/core/session'
import { Breadcrumb } from '@bugsnag/core'
import NetworkStatus from '@bugsnag/electron-network-status'
import MinidumpDeliveryLoop from '../minidump-loop'

const flushPromises = () => new Promise(setImmediate)

jest.useFakeTimers()

jest.mock('fs', () => ({
  promises: {
    readFile: () => Promise.resolve('{}')
  }
}))

const createQueue = (...minidumps) => ({
  peek: minidumps.reduce((fn, md) => fn.mockResolvedValueOnce(md), jest.fn()),
  remove: jest.fn().mockResolvedValue(true)
})

const createSendMinidump = () => jest.fn().mockResolvedValue(true)

const runDeliveryLoop = async (times: number = 1) => {
  for (let i = 0; i < times; i++) {
    jest.runOnlyPendingTimers()
    await flushPromises()
  }
}

describe('electron-minidump-delivery: minidump-loop', () => {
  const onSendCallbacks = []
  const logger = {
    error: () => {}
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

      expect(sendMinidump).toBeCalledTimes(1)
      expect(minidumpQueue.remove).toBeCalledTimes(1)
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

      expect(sendMinidump).toBeCalledTimes(1)
      expect(minidumpQueue.remove).toBeCalledTimes(1)
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

    expect(sendMinidump).toBeCalledTimes(0)
    expect(minidumpQueue.remove).toBeCalledTimes(2)
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

    expect(sendMinidump).toBeCalledWith('minidump-path', {
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

    expect(minidumpQueue.remove).toBeCalledWith({
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

    expect(sendMinidump).toBeCalledTimes(0)
    expect(minidumpQueue.remove).toBeCalledTimes(2)

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

    const loop = new MinidumpDeliveryLoop(sendMinidump, callbacks, minidumpQueue, { error: logError })
    loop.start()

    await runDeliveryLoop(2)

    expect(sendMinidump).toBeCalledTimes(2)
    expect(minidumpQueue.remove).toBeCalledTimes(2)

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

    expect(sendMinidump).toBeCalledTimes(2)
    expect(minidumpQueue.remove).toBeCalledTimes(2)

    expect(jest.getTimerCount()).toBe(0)
  })

  it('attempts redelivery', async () => {
    const retryError: any = new Error()
    retryError.isRetryable = true
    const sendMinidump = jest.fn()
      .mockRejectedValueOnce(retryError)
      .mockResolvedValueOnce(true)

    const minidumpQueue = createQueue(
      { minidumpPath: 'minidump-path1', eventPath: 'event-path1' },
      { minidumpPath: 'minidump-path2', eventPath: 'event-path2' }
    )

    const loop = new MinidumpDeliveryLoop(sendMinidump, onSendCallbacks, minidumpQueue, logger)
    loop.start()

    await runDeliveryLoop(2)

    expect(sendMinidump).toBeCalledTimes(2)
    expect(minidumpQueue.remove).toBeCalledTimes(1)
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
      expect(sendMinidump).toBeCalledTimes(0)

      // connect the network
      emitter.emit('MetadataUpdate', { section: 'device', values: { online: true } }, null)

      // check that we've started delivering minidumps
      await runDeliveryLoop(1)
      expect(sendMinidump).toBeCalledTimes(1)
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
      expect(sendMinidump).toBeCalledTimes(1)

      // disconnect the network
      emitter.emit('MetadataUpdate', { section: 'device', values: { online: false } }, null)

      // check that no more minidumps are delivered
      await runDeliveryLoop(2)
      expect(sendMinidump).toBeCalledTimes(1)
    })
  })
})
