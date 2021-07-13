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
  const onSend = () => true
  const logger = {}

  describe('delivers minidumps', () => {
    it('delivers minidumps', async () => {
      const sendMinidump = createSendMinidump()
      const minidumpQueue = createQueue(
        { minidumpPath: 'minidump-path1', eventPath: 'event-path1' },
        { minidumpPath: 'minidump-path2', eventPath: 'event-path2' }
      )

      const loop = new MinidumpDeliveryLoop(sendMinidump, onSend, minidumpQueue, logger)
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

      const loop = new MinidumpDeliveryLoop(sendMinidump, onSend, minidumpQueue, logger)
      loop.start()

      await runDeliveryLoop()

      expect(sendMinidump).toBeCalledTimes(1)
      expect(minidumpQueue.remove).toBeCalledTimes(1)
    })
  })

  it('skips events blocked by onSend', async () => {
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

  it('stops when the queue is exhausted', async () => {
    const sendMinidump = createSendMinidump()
    const minidumpQueue = createQueue(
      { minidumpPath: 'minidump-path1', eventPath: 'event-path1' },
      { minidumpPath: 'minidump-path2', eventPath: 'event-path2' }
    )

    const loop = new MinidumpDeliveryLoop(sendMinidump, onSend, minidumpQueue, logger)
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

    const loop = new MinidumpDeliveryLoop(sendMinidump, onSend, minidumpQueue, logger)
    loop.start()

    await runDeliveryLoop(2)

    expect(sendMinidump).toBeCalledTimes(2)
    expect(minidumpQueue.remove).toBeCalledTimes(1)
  })
})
