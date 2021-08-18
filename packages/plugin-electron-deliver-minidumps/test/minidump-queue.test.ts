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

    it('does not return minidumps where remove() failed', async () => {
      const minidump2 = { minidumpPath: 'minidump-path2', eventPath: 'event-path2' }
      const mockFileStore = {
        listMinidumps: jest.fn().mockResolvedValue([
          { minidumpPath: 'minidump-path1', eventPath: 'event-path1' },
          minidump2
        ]),
        deleteMinidump: jest.fn().mockRejectedValue(new Error())
      }

      const queue = new MinidumpQueue(mockFileStore)
      const minidump1 = await queue.peek()
      expect(minidump1).toStrictEqual({ minidumpPath: 'minidump-path1', eventPath: 'event-path1' })

      try {
        await queue.remove(minidump1)
      } catch (e) {
        // ignore error
      }

      expect(await queue.peek()).toStrictEqual(minidump2)
    })
  })

  describe('push()', () => {
    const mockFileStore = {
      listMinidumps: jest.fn().mockResolvedValue([]),
      deleteMinidump: jest.fn().mockResolvedValue(undefined)
    }

    it('is a no-op until the first peek', async () => {
      const queue = new MinidumpQueue(mockFileStore)
      queue.push({ minidumpPath: 'new-item' })
      expect(await queue.peek()).toStrictEqual(undefined)
    })

    it('adds new minidumps', async () => {
      const queue = new MinidumpQueue(mockFileStore)
      await queue.peek() // load list
      const minidump = { minidumpPath: 'new-item' }
      queue.push(minidump)
      expect(await queue.peek()).toStrictEqual(minidump)
    })

    it('disallows adding the same minidump path twice', async () => {
      const queue = new MinidumpQueue(mockFileStore)
      await queue.peek() // load list

      const minidump1 = { minidumpPath: 'new-item' }
      const minidump2 = { minidumpPath: 'new-item' }
      queue.push(minidump1)
      queue.push(minidump2)
      expect(await queue.peek()).toStrictEqual(minidump1)
      queue.remove(minidump1)
      expect(await queue.peek()).toStrictEqual(undefined)
    })

    it('disallows adding the same minidump path after removal', async () => {
      const queue = new MinidumpQueue(mockFileStore)
      await queue.peek() // load list

      const minidump1 = { minidumpPath: 'new-item' }
      const minidump2 = { minidumpPath: 'new-item' }
      queue.push(minidump1)
      expect(await queue.peek()).toStrictEqual(minidump1)
      queue.remove(minidump1)
      queue.push(minidump2)
      expect(await queue.peek()).toStrictEqual(undefined)
    })
  })

  describe('hasSeen()', () => {
    let queue: MinidumpQueue

    beforeEach(async () => {
      const mockFileStore = {
        listMinidumps: jest.fn().mockResolvedValue([{ minidumpPath: 'something' }]),
        deleteMinidump: jest.fn().mockResolvedValue(undefined)
      }
      queue = new MinidumpQueue(mockFileStore)
      await queue.peek() // load list
    })

    it('detects minidumps from disk', async () => {
      expect(queue.hasSeen('something')).toBeTruthy()
      expect(queue.hasSeen('something-else')).toBeFalsy()
    })

    it('detects pushed minidumps', async () => {
      queue.push({ minidumpPath: 'some-other-thing' })
      expect(queue.hasSeen('some-other-thing')).toBeTruthy()
    })

    it('detects removed minidumps', async () => {
      queue.remove({ minidumpPath: 'something' })
      expect(await queue.peek()).toStrictEqual(undefined)
      expect(queue.hasSeen('something')).toBeTruthy()
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
