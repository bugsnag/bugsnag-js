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

const createSendMinidump = () => jest.fn().mockImplementation((mb, ev, cb) => cb())

describe('electron-minidump-delivery: minidump-loop', () => {
  const onSend = () => {}
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

      jest.runOnlyPendingTimers()
      await flushPromises()

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

      jest.runOnlyPendingTimers()
      await flushPromises()

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

    for (let i = 0; i < 2; i++) {
      jest.runOnlyPendingTimers()
      await flushPromises()
    }

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

    for (let i = 0; i < 3; i++) {
      jest.runOnlyPendingTimers()
      await flushPromises()
    }

    expect(sendMinidump).toBeCalledTimes(2)
    expect(minidumpQueue.remove).toBeCalledTimes(2)

    expect(jest.getTimerCount()).toBe(0)
  })
})
