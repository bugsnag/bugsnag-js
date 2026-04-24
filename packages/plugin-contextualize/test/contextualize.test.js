const { Client } = require('@bugsnag/core')
const plugin = require('../contextualize')
const { AsyncLocalStorage } = require('async_hooks')

describe('plugin: contextualize', () => {
  describe('client cloning', () => {
    it('creates a cloned client for the contextualized scope', () => {
      const c = new Client({ apiKey: 'api_key', plugins: [plugin] })
      c._clientContext = new AsyncLocalStorage()
      const contextualize = c.getPlugin('contextualize')

      let capturedClient = null
      contextualize(() => {
        capturedClient = c._clientContext.getStore()
      }, (event) => {})

      expect(capturedClient).not.toBe(c)
      expect(capturedClient).toBeTruthy()
    })

    it('sets fallbackStack on the cloned client', () => {
      const c = new Client({ apiKey: 'api_key', plugins: [plugin] })
      c._clientContext = new AsyncLocalStorage()
      const contextualize = c.getPlugin('contextualize')

      let capturedClient = null
      contextualize(() => {
        capturedClient = c._clientContext.getStore()
      }, (event) => {})

      expect(capturedClient.fallbackStack).toBeDefined()
      expect(typeof capturedClient.fallbackStack).toBe('string')
    })
  })

  describe('onError callback', () => {
    it('adds the onError callback to the cloned client', () => {
      const c = new Client({ apiKey: 'api_key', plugins: [plugin] })
      c._clientContext = new AsyncLocalStorage()
      const contextualize = c.getPlugin('contextualize')

      const onError = jest.fn()
      let capturedClient = null

      contextualize(() => {
        capturedClient = c._clientContext.getStore()
      }, onError)

      expect(capturedClient._cbs.e.length).toBeGreaterThan(0)
    })

    it('does not add onError to the parent client', () => {
      const c = new Client({ apiKey: 'api_key', plugins: [plugin] })
      c._clientContext = new AsyncLocalStorage()
      const contextualize = c.getPlugin('contextualize')

      const initialCallbackCount = c._cbs.e.length

      contextualize(() => {}, (event) => {
        event.addMetadata('test', { key: 'value' })
      })

      expect(c._cbs.e.length).toBe(initialCallbackCount)
    })
  })

  describe('context isolation', () => {
    it('isolates metadata changes within the contextualized scope', () => {
      const c = new Client({ apiKey: 'api_key', plugins: [plugin] })
      c._clientContext = new AsyncLocalStorage()
      const contextualize = c.getPlugin('contextualize')

      let clonedClient = null
      contextualize(() => {
        clonedClient = c._clientContext.getStore()
        clonedClient.addMetadata('custom', { foo: 'bar' })
      }, (event) => {})

      expect(c.getMetadata('custom')).toBeUndefined()
      expect(clonedClient.getMetadata('custom')).toEqual({ foo: 'bar' })
    })
  })

  describe('async execution', () => {
    it('maintains context in async operations', async () => {
      const c = new Client({ apiKey: 'api_key', plugins: [plugin] })
      c._clientContext = new AsyncLocalStorage()
      const contextualize = c.getPlugin('contextualize')

      let capturedClient = null
      await contextualize(async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        capturedClient = c._clientContext.getStore()
      }, (event) => {})

      expect(capturedClient).toBeTruthy()
      expect(capturedClient.fallbackStack).toBeDefined()
    })

    it('returns a promise when callback is async', async () => {
      const c = new Client({ apiKey: 'api_key', plugins: [plugin] })
      c._clientContext = new AsyncLocalStorage()
      const contextualize = c.getPlugin('contextualize')

      const result = contextualize(async () => {
        return 'async value'
      }, (event) => {})

      expect(result).toBeInstanceOf(Promise)
      await expect(result).resolves.toBe('async value')
    })
  })

  describe('callback execution', () => {
    it('executes the callback function', () => {
      const c = new Client({ apiKey: 'api_key', plugins: [plugin] })
      c._clientContext = new AsyncLocalStorage()
      const contextualize = c.getPlugin('contextualize')

      const callback = jest.fn(() => 'result')
      contextualize(callback, (event) => {})

      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('passes through exceptions from the callback', () => {
      const c = new Client({ apiKey: 'api_key', plugins: [plugin] })
      c._clientContext = new AsyncLocalStorage()
      const contextualize = c.getPlugin('contextualize')

      const error = new Error('test error')
      expect(() => {
        contextualize(() => {
          throw error
        }, (event) => {})
      }).toThrow(error)
    })
  })

  describe('return value', () => {
    it('returns the value returned by the callback function', () => {
      const c = new Client({ apiKey: 'api_key', plugins: [plugin] })
      c._clientContext = new AsyncLocalStorage()
      const contextualize = c.getPlugin('contextualize')

      const result = contextualize(() => {
        return 'test value'
      }, (event) => {
        event.addMetadata('test', { key: 'value' })
      })

      expect(result).toBe('test value')
    })
  })
})
