import { AsyncLocalStorage } from 'async_hooks'
import { Client, Event, OnErrorCallback } from '@bugsnag/core'
import plugin from '../src/contextualize'

type InternalClient = Client & {
  _clientContext: AsyncLocalStorage<Client>
  _cbs: Client['_cbs']
  fallbackStack?: string
}

type ContextualizeFn = <T>(fn: () => T | Promise<T>, onError?: OnErrorCallback) => T | Promise<T>

const getContextualize = (client: Client): ContextualizeFn => {
  const contextualize = client.getPlugin('contextualize')

  if (!contextualize) {
    throw new Error('getPlugin("contextualize") failed')
  }

  return contextualize as ContextualizeFn
}

describe('plugin: contextualize', () => {
  describe('client cloning', () => {
    it('creates a cloned client for the contextualized scope', () => {
      const c = new Client({ apiKey: 'api_key', plugins: [plugin] }) as unknown as InternalClient
      c._clientContext = new AsyncLocalStorage()
      const contextualize = getContextualize(c)

      let capturedClient: InternalClient | undefined
      contextualize(() => {
        capturedClient = c._clientContext.getStore() as unknown as InternalClient
      }, (_event: Event) => {})

      expect(capturedClient).not.toBe(c)
      expect(capturedClient).toBeTruthy()
    })

    it('sets fallbackStack on the cloned client', () => {
      const c = new Client({ apiKey: 'api_key', plugins: [plugin] }) as unknown as InternalClient
      c._clientContext = new AsyncLocalStorage()
      const contextualize = getContextualize(c)

      let capturedClient: InternalClient | undefined
      contextualize(() => {
        capturedClient = c._clientContext.getStore() as unknown as InternalClient
      }, (_event: Event) => {})

      expect(capturedClient?.fallbackStack).toBeDefined()
      expect(typeof capturedClient?.fallbackStack).toBe('string')
    })
  })

  describe('onError callback', () => {
    it('adds the onError callback to the cloned client', () => {
      const c = new Client({ apiKey: 'api_key', plugins: [plugin] }) as unknown as InternalClient
      c._clientContext = new AsyncLocalStorage()
      const contextualize = getContextualize(c)

      const onError = jest.fn()
      let capturedClient: InternalClient | undefined

      contextualize(() => {
        capturedClient = c._clientContext.getStore() as unknown as InternalClient
      }, onError)

      expect(capturedClient?._cbs.e.length).toBeGreaterThan(0)
    })

    it('does not add onError to the parent client', () => {
      const c = new Client({ apiKey: 'api_key', plugins: [plugin] }) as unknown as InternalClient
      c._clientContext = new AsyncLocalStorage()
      const contextualize = getContextualize(c)

      const initialCallbackCount = c._cbs.e.length

      contextualize(() => {}, (event: Event) => {
        event.addMetadata('test', { key: 'value' })
      })

      expect(c._cbs.e.length).toBe(initialCallbackCount)
    })
  })

  describe('context isolation', () => {
    it('isolates metadata changes within the contextualized scope', () => {
      const c = new Client({ apiKey: 'api_key', plugins: [plugin] }) as unknown as InternalClient
      c._clientContext = new AsyncLocalStorage()
      const contextualize = getContextualize(c)

      let clonedClient: Client | undefined
      contextualize(() => {
        clonedClient = c._clientContext.getStore()
        clonedClient?.addMetadata('custom', { foo: 'bar' })
      }, (_event: Event) => {})

      expect(c.getMetadata('custom')).toBeUndefined()
      expect(clonedClient?.getMetadata('custom')).toEqual({ foo: 'bar' })
    })
  })

  describe('async execution', () => {
    it('maintains context in async operations', async () => {
      const c = new Client({ apiKey: 'api_key', plugins: [plugin] }) as unknown as InternalClient
      c._clientContext = new AsyncLocalStorage()
      const contextualize = getContextualize(c)

      let capturedClient: InternalClient | undefined
      await contextualize(async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        capturedClient = c._clientContext.getStore() as unknown as InternalClient
      }, (_event: Event) => {})

      expect(capturedClient).toBeTruthy()
      expect(capturedClient?.fallbackStack).toBeDefined()
    })

    it('returns the callback promise when callback is async', async () => {
      const c = new Client({ apiKey: 'api_key', plugins: [plugin] }) as unknown as InternalClient
      c._clientContext = new AsyncLocalStorage()
      const contextualize = getContextualize(c)

      const result = contextualize(async () => {
        return 'async value'
      }, (_event: Event) => {})

      await expect(result).resolves.toBe('async value')
    })
  })

  describe('callback execution', () => {
    it('executes the callback function', () => {
      const c = new Client({ apiKey: 'api_key', plugins: [plugin] }) as unknown as InternalClient
      c._clientContext = new AsyncLocalStorage()
      const contextualize = getContextualize(c)

      const callback = jest.fn(() => 'result')
      contextualize(callback, (_event: Event) => {})

      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('passes through exceptions from the callback', () => {
      const c = new Client({ apiKey: 'api_key', plugins: [plugin] }) as unknown as InternalClient
      c._clientContext = new AsyncLocalStorage()
      const contextualize = getContextualize(c)

      const error = new Error('test error')
      expect(() => {
        contextualize(() => {
          throw error
        }, (_event: Event) => {})
      }).toThrow(error)
    })
  })

  describe('return value', () => {
    it('returns the callback result from contextualize', () => {
      const c = new Client({ apiKey: 'api_key', plugins: [plugin] }) as unknown as InternalClient
      c._clientContext = new AsyncLocalStorage()
      const contextualize = getContextualize(c)

      const result = contextualize(() => {
        return 'test value'
      }, (event: Event) => {
        event.addMetadata('test', { key: 'value' })
      })

      expect(result).toBe('test value')
    })

    it('allows contextualize without an onError callback', () => {
      const c = new Client({ apiKey: 'api_key', plugins: [plugin] }) as unknown as InternalClient
      c._clientContext = new AsyncLocalStorage()
      const contextualize = getContextualize(c)

      const result = contextualize(() => 'test value')

      expect(result).toBe('test value')
    })
  })
})
