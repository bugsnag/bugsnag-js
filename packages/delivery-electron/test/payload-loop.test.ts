import PayloadDeliveryLoop from '../payload-loop'

describe('delivery: electron -> payload delivery loop', () => {
  it('attempts to dequeue (almost) immediately', done => {
    const send = (opts: any, _body: any, cb: () => void) => {
      expect(opts.url).toBe('https://notify.bugsnag.com')
      consumer.stop()
      cb()
      done()
    }
    const queue = {
      remove: async () => {},
      peek: async () => {
        return Promise.resolve({
          path: '/path/to/payload.json',
          payload: {
            opts: { url: 'https://notify.bugsnag.com' },
            body: { counters: [1, 2, 3] }
          }
        })
      },
      enqueue: async () => {}
    }
    const consumer = new PayloadDeliveryLoop(send, queue, () => {}, 1)
    consumer.start()
  })

  it('clears the timeout if nothing is found on the queue', done => {
    const send = (opts: any, _body: {}, cb: () => void) => {
      expect(opts.url).toBe('https://notify.bugsnag.com')
      expect(nCalls).toBe(5)
      consumer.stop()
      cb()
      done()
    }
    let nCalls = 0
    const queue = {
      remove: async () => {},
      enqueue: async () => {},
      peek: async () => {
        nCalls++
        if (nCalls < 5) {
          setTimeout(() => {
            expect(stopSpy).toHaveBeenCalled()
            done()
          }, 0)
          return Promise.resolve(null)
        }
        return Promise.resolve({
          path: '/path/to/payload.json',
          payload: {
            opts: { url: 'https://notify.bugsnag.com' },
            body: { counters: [1, 2, 3] }
          }
        })
      }
    }
    const consumer = new PayloadDeliveryLoop(send, queue, () => {}, 1)
    const stopSpy = jest.spyOn(consumer, 'stop')
    consumer.start()
  })

  it('does not remove an item from the queue if it fails to send', done => {
    const send = (_opts: {}, _body: {}, cb: (err?: Error) => void) => {
      cb(new Error('derp'))
    }

    const req = {
      path: '/path/to/payload.json',
      payload: {
        opts: { url: 'https://notify.bugsnag.com' },
        body: { counters: [1, 2, 3] }
      }
    }

    const queue = {
      remove: async () => {},
      enqueue: async () => {},
      peek: async () => Promise.resolve(req)
    }

    const removeSpy = jest.spyOn(queue, 'remove')
    const consumer = new PayloadDeliveryLoop(send, queue, () => {}, 1)
    consumer.start()
    setTimeout(() => {
      expect(removeSpy).not.toHaveBeenCalled()
      done()
    }, 5)
  })

  it('removes something from the queue if it fails in a non-retryable way', done => {
    const send = (_opts: {}, _body: {}, cb: (err?: Error) => void) => {
      const err: Error & { isRetryable?: boolean } = new Error('derp')
      err.isRetryable = false
      cb(err)
    }

    const req = {
      path: '/path/to/payload.json',
      payload: {
        opts: { url: 'https://notify.bugsnag.com' },
        body: { counters: [1, 2, 3] }
      }
    }

    const queue = {
      remove: async () => {},
      enqueue: async () => {},
      peek: async () => Promise.resolve(req)
    }

    const removeSpy = jest.spyOn(queue, 'remove')
    const consumer = new PayloadDeliveryLoop(send, queue, () => {}, 1)
    consumer.start()
    setTimeout(() => {
      expect(removeSpy).toHaveBeenCalledWith('/path/to/payload.json')
      consumer.stop()
      done()
    }, 5)
  })
})
