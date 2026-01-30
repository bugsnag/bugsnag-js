import PayloadDeliveryLoop from '../payload-loop'

describe('delivery: electron -> payload delivery loop', () => {
  it('attempts to dequeue (almost) immediately', async () => {
    let resolveSend: (opts: any) => void
    const sendPromise = new Promise<any>((resolve) => { resolveSend = resolve })

    const send = (opts: any, _body: any, cb: () => void) => {
      consumer.stop()
      cb()
      resolveSend(opts)
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

    const capturedOpts = await sendPromise
    expect(capturedOpts.url).toBe('https://notify.bugsnag.com')
  })

  it('clears the timeout if nothing is found on the queue', async () => {
    let resolveFirstPeek: () => void
    const firstPeekPromise = new Promise<void>((resolve) => { resolveFirstPeek = resolve })

    let nCalls = 0
    const queue = {
      remove: async () => {},
      enqueue: async () => {},
      peek: async () => {
        nCalls++
        if (nCalls === 1) {
          // Resolve after first peek to allow stop to be called
          setTimeout(() => resolveFirstPeek(), 0)
        }
        return Promise.resolve(null)
      }
    }

    const send = (opts: any, _body: {}, cb: () => void) => {
      // This should never be called since peek always returns null
      cb()
    }

    const consumer = new PayloadDeliveryLoop(send, queue, () => {}, 1)
    const stopSpy = jest.spyOn(consumer, 'stop')
    consumer.start()

    await firstPeekPromise
    expect(stopSpy).toHaveBeenCalled()
    expect(nCalls).toBe(1)
  })

  it('does not remove an item from the queue if it fails to send', async () => {
    let resolveSend: () => void
    const sendPromise = new Promise<void>((resolve) => { resolveSend = resolve })

    const send = (_opts: {}, _body: {}, cb: (err?: Error) => void) => {
      cb(new Error('derp'))
      resolveSend()
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

    await sendPromise
    await new Promise(resolve => setTimeout(resolve, 5))
    expect(removeSpy).not.toHaveBeenCalled()
    consumer.stop()
  })

  it('removes something from the queue if it fails in a non-retryable way', async () => {
    let resolveSend: () => void
    const sendPromise = new Promise<void>((resolve) => { resolveSend = resolve })

    const send = (_opts: {}, _body: {}, cb: (err?: Error) => void) => {
      const err: Error & { isRetryable?: boolean } = new Error('derp')
      err.isRetryable = false
      cb(err)
      resolveSend()
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

    await sendPromise
    await new Promise(resolve => setTimeout(resolve, 5))
    expect(removeSpy).toHaveBeenCalledWith('/path/to/payload.json')
    consumer.stop()
  })
})
