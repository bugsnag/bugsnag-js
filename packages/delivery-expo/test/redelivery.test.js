/* global describe, it, expect, spyOn */

const redelivery = require('../redelivery')

describe('delivery: expo -> redelivery', () => {
  it('should attempt to dequeue (almost) immediately', done => {
    const send = (url, opts, cb) => {
      expect(url).toBe('https://notify.bugsnag.com')
      stop()
      cb()
      done()
    }
    const queue = {
      enqueue: async () => {},
      dequeue: async () => {
        return Promise.resolve({
          url: 'https://notify.bugsnag.com',
          opts: {},
          retries: 0
        })
      }
    }
    const stop = redelivery(send, queue, () => {}, 1, 5)
  })

  it('should check again after the timeout if nothing is found on the queue', done => {
    const send = (url, opts, cb) => {
      expect(url).toBe('https://notify.bugsnag.com')
      expect(nCalls).toBe(5)
      stop()
      done()
    }
    let nCalls = 0
    const queue = {
      enqueue: async () => {},
      dequeue: async () => {
        nCalls++
        if (nCalls < 5) return Promise.resolve(null)
        return Promise.resolve({
          url: 'https://notify.bugsnag.com',
          opts: {},
          retries: 0
        })
      }
    }
    const stop = redelivery(send, queue, () => {}, 1, 5)
  })

  it('should place something back on the queue if it fails to send', done => {
    const send = (url, opts, cb) => {
      cb(new Error('derp'))
    }

    const req = {
      url: 'https://notify.bugsnag.com',
      opts: {},
      retries: 0
    }

    const queue = {
      enqueue: async (r) => {
        stop()
        expect(r.retries).toBe(req.retries + 1)
        done()
      },
      dequeue: async () => {
        return Promise.resolve(req)
      }
    }
    const stop = redelivery(send, queue, () => {}, 1, 5)
  })

  it('doesn’t place something back on the queue if it fails in a non-retryable way', done => {
    const send = (url, opts, cb) => {
      const err = new Error('derp')
      err.isRetryable = false
      cb(err)
    }

    const req = {
      url: 'https://notify.bugsnag.com',
      opts: {},
      retries: 0
    }

    const queue = {
      enqueue: async (r) => {
        done()
      },
      dequeue: async () => {
        stop()
        return Promise.resolve(req)
      }
    }

    const enqueueSpy = spyOn(queue, 'enqueue')
    const stop = redelivery(send, queue, () => {}, 1, 5)
    setTimeout(() => {
      expect(enqueueSpy).not.toHaveBeenCalled()
      done()
    }, 20)
  })

  it('doesn’t place something back on the queue if it reaches the maximum retries', done => {
    const send = (url, opts, cb) => {
      const err = new Error('derp')
      cb(err)
    }

    const req = {
      url: 'https://notify.bugsnag.com',
      opts: {},
      retries: 4
    }

    const queue = {
      enqueue: async (r) => {
        done()
      },
      dequeue: async () => {
        stop()
        return Promise.resolve(req)
      }
    }

    const enqueueSpy = spyOn(queue, 'enqueue')
    const stop = redelivery(send, queue, () => {}, 1, 5)
    setTimeout(() => {
      expect(enqueueSpy).not.toHaveBeenCalled()
      done()
    }, 20)
  })
})
