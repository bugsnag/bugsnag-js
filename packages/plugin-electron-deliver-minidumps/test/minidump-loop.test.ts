import EventEmitter from 'events'
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

    // the callbacks are called twice as there are two minidumps
    expect(callbacks[0]).toHaveBeenCalledTimes(2)
    expect(callbacks[1]).toHaveBeenCalledTimes(2)
    expect(callbacks[2]).not.toHaveBeenCalled()
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

  it('attempts redlivery', async () => {
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
