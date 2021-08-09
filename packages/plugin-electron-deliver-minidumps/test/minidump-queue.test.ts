import MinidumpQueue from '../minidump-queue'

describe('electron-minidump-delivery: queue', () => {
  describe('peek()', () => {
    it('empty queues are safe', async () => {
      const mockFileStore = {
        listMinidumps: jest.fn().mockResolvedValue([])
      }

      const queue = new MinidumpQueue(mockFileStore)
      expect(await queue.peek()).toBeFalsy()
    })

    it('returns the same minidump when called twice', async () => {
      const mockFileStore = {
        listMinidumps: jest.fn().mockResolvedValue([
          { minidumpPath: 'minidump-path1', eventPath: 'event-path1' }
        ])

      }

      const queue = new MinidumpQueue(mockFileStore)
      const queueHead = await queue.peek()

      expect(await queue.peek()).toStrictEqual(queueHead)
    })
  })

  describe('remove()', () => {
    it('is safe when passed null', async () => {
      const mockFileStore = {
        listMinidumps: jest.fn().mockResolvedValue([]),
        deleteMinidump: jest.fn().mockRejectedValue(new Error())
      }

      const queue = new MinidumpQueue(mockFileStore)
      await queue.remove(null)

      expect(mockFileStore.deleteMinidump.mock.calls.length).toBe(0)
    })

    it('removes valid minidumps', async () => {
      const mockFileStore = {
        listMinidumps: jest.fn().mockResolvedValue([
          { minidumpPath: 'minidump-path1', eventPath: 'event-path1' },
          { minidumpPath: 'minidump-path2', eventPath: 'event-path2' }
        ]),
        deleteMinidump: jest.fn().mockResolvedValue(undefined)
      }

      const queue = new MinidumpQueue(mockFileStore)
      await queue.remove({ minidumpPath: 'minidump-path2', eventPath: 'event-path2' })

      expect(mockFileStore.deleteMinidump.mock.calls).toEqual([
        [{ minidumpPath: 'minidump-path2', eventPath: 'event-path2' }]
      ])
    })
  })
})
