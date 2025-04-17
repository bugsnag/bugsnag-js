import clientStateUpdatesPlugin from '../client-state-updates'
import { Client } from '@bugsnag/core'

const Notifier = {
  name: 'Bugsnag Electron Test',
  version: '0.0.0',
  url: 'https://github.com/bugsnag/bugsnag-js'
}

describe('clientStateUpdatesPlugin', () => {
  describe('propagation of changes to the IPC layer', () => {
    it('propagates context changes', () => {
      const mockBugsnagIpcRenderer = {
        setContext: jest.fn()
      }
      const client = new Client({ apiKey: '123' }, {}, [clientStateUpdatesPlugin(mockBugsnagIpcRenderer)], Notifier)

      client.setContext('ctx')
      expect(mockBugsnagIpcRenderer.setContext).toHaveBeenCalledWith('ctx')
    })

    it('forwards upstream changes to context', () => {
      const mockBugsnagIpcRenderer = {
        getContext: () => 'ctx'
      }
      const client = new Client({ apiKey: '123' }, {}, [clientStateUpdatesPlugin(mockBugsnagIpcRenderer)], Notifier)
      expect(client.getContext()).toBe('ctx')
    })

    it('propagates user changes', () => {
      const mockBugsnagIpcRenderer = {
        setUser: jest.fn()
      }
      const client = new Client({ apiKey: '123' }, {}, [clientStateUpdatesPlugin(mockBugsnagIpcRenderer)], Notifier)

      client.setUser('123', 'jim@jim.com', 'Jim')
      expect(mockBugsnagIpcRenderer.setUser).toHaveBeenCalledWith('123', 'jim@jim.com', 'Jim')
    })

    it('forwards upstream changes to user', () => {
      const mockBugsnagIpcRenderer = {
        getUser: () => { return { id: '123', email: 'jim@jim.com', name: 'Jim' } }
      }
      const client = new Client({ apiKey: '123' }, {}, [clientStateUpdatesPlugin(mockBugsnagIpcRenderer)], Notifier)

      expect(client.getUser()).toEqual({ id: '123', email: 'jim@jim.com', name: 'Jim' })
    })

    it('propagates metadata changes', () => {
      const mockBugsnagIpcRenderer = {
        addMetadata: jest.fn(),
        clearMetadata: jest.fn()
      }
      const client = new Client({ apiKey: '123' }, {}, [clientStateUpdatesPlugin(mockBugsnagIpcRenderer)], Notifier)

      client.addMetadata('section', { key0: 123, key1: 234 })
      expect(mockBugsnagIpcRenderer.addMetadata).toHaveBeenCalledWith('section', { key0: 123, key1: 234 })

      client.clearMetadata('section', 'key0')
      expect(mockBugsnagIpcRenderer.clearMetadata).toHaveBeenCalledWith('section', 'key0')

      client.clearMetadata('section')
      expect(mockBugsnagIpcRenderer.clearMetadata).toHaveBeenCalledWith('section')
    })

    it('forwards upstream changes to metadata', done => {
      const mockBugsnagIpcRenderer = {
        getMetadata: (tab: string, key?: string) => {
          expect(tab).toEqual('layers')
          expect(key).toEqual('strawberry')
          done()
        }
      }
      const client = new Client({ apiKey: '123' }, {}, [clientStateUpdatesPlugin(mockBugsnagIpcRenderer)], Notifier)
      client.getMetadata('layers', 'strawberry')
    })

    it('propagates feature flag changes', () => {
      const mockBugsnagIpcRenderer = {
        addFeatureFlag: jest.fn(),
        addFeatureFlags: jest.fn(),
        clearFeatureFlag: jest.fn(),
        clearFeatureFlags: jest.fn()
      }

      const client = new Client({ apiKey: '123' }, {}, [clientStateUpdatesPlugin(mockBugsnagIpcRenderer)], Notifier)

      client.addFeatureFlag('name', 'variant')
      expect(mockBugsnagIpcRenderer.addFeatureFlag).toHaveBeenCalledWith('name', 'variant')

      client.addFeatureFlags([{ name: 'abc' }])
      expect(mockBugsnagIpcRenderer.addFeatureFlags).toHaveBeenCalledWith([{ name: 'abc' }])

      client.clearFeatureFlag('name')
      expect(mockBugsnagIpcRenderer.clearFeatureFlag).toHaveBeenCalledWith('name')

      client.clearFeatureFlags()
      expect(mockBugsnagIpcRenderer.clearFeatureFlags).toHaveBeenCalledWith()
    })

    it('propagates breadcrumb changes', () => {
      const mockBugsnagIpcRenderer = {
        leaveBreadcrumb: jest.fn()
      }
      const client = new Client({ apiKey: '123' }, {}, [clientStateUpdatesPlugin(mockBugsnagIpcRenderer)], Notifier)
      client.leaveBreadcrumb('hi')
      expect(mockBugsnagIpcRenderer.leaveBreadcrumb).toHaveBeenCalledWith(expect.objectContaining({
        message: 'hi',
        metadata: {},
        type: 'manual'
      }))
    })

    it('does not propagate breadcrumb if it is cancelled by an onBreadcrumb callback', () => {
      const mockBugsnagIpcRenderer = {
        leaveBreadcrumb: jest.fn()
      }

      const client = new Client({ apiKey: '123' }, {}, [clientStateUpdatesPlugin(mockBugsnagIpcRenderer)], Notifier)

      client.addOnBreadcrumb(breadcrumb => {
        if (breadcrumb.message === 'skip me') {
          return false
        }
      })

      // this onBreadcrumb is added last so it should always be called as it runs first
      const alwaysCalledOnBreadcrumb = jest.fn()
      client.addOnBreadcrumb(alwaysCalledOnBreadcrumb)

      client.leaveBreadcrumb('skip me')

      expect(alwaysCalledOnBreadcrumb).toHaveBeenCalled()
      expect(mockBugsnagIpcRenderer.leaveBreadcrumb).not.toHaveBeenCalled()

      client.leaveBreadcrumb('this should be synced!')

      expect(alwaysCalledOnBreadcrumb).toHaveBeenCalled()
      expect(mockBugsnagIpcRenderer.leaveBreadcrumb).toHaveBeenCalledWith(expect.objectContaining({
        message: 'this should be synced!',
        metadata: {},
        type: 'manual'
      }))
    })

    it('tolerates errors', () => {
      const throwError = () => { throw new Error('oops') }
      const mockBugsnagIpcRenderer = {
        setUser: jest.fn().mockImplementation(throwError),
        setContext: jest.fn().mockImplementation(throwError),
        addMetadata: jest.fn().mockImplementation(throwError),
        clearMetadata: jest.fn().mockImplementation(throwError),
        leaveBreadcrumb: jest.fn().mockImplementation(throwError)
      }
      const client = new Client({ apiKey: '123' }, {}, [clientStateUpdatesPlugin(mockBugsnagIpcRenderer)], Notifier)
      expect(() => {
        client.setContext('ctx')
        client.setUser('123')
        client.addMetadata('section', 'key', 123)
        client.clearMetadata('section')
        client.leaveBreadcrumb('hi')
      }).not.toThrow()
    })

    it('propagates state set in renderer config', () => {
      const mockBugsnagIpcRenderer = {
        update: jest.fn()
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const client = new Client({
        apiKey: '123',
        metadata: { section: { key: 'value' } },
        featureFlags: [{ name: 'abc' }, { name: 'xyz', variant: '123' }],
        context: 'renderer config',
        user: { id: 'ab23' }
      }, undefined, [clientStateUpdatesPlugin(mockBugsnagIpcRenderer)])

      expect(mockBugsnagIpcRenderer.update).toHaveBeenCalledWith({
        metadata: { section: { key: 'value' } },
        features: [{ name: 'abc', variant: null }, { name: 'xyz', variant: '123' }],
        user: { id: 'ab23' },
        context: 'renderer config'
      })
    })

    it('propagates partial state set in renderer config', () => {
      const mockBugsnagIpcRenderer = {
        update: jest.fn()
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const client = new Client({
        apiKey: '123',
        metadata: { section: { key: 'value' } },
        user: {}
      }, undefined, [clientStateUpdatesPlugin(mockBugsnagIpcRenderer)])

      expect(mockBugsnagIpcRenderer.update).toHaveBeenCalledWith({
        metadata: { section: { key: 'value' } },
        features: []
      })
    })

    it('does not store state in renderer client', () => {
      const mockBugsnagIpcRenderer = {
        update: jest.fn()
      }

      const client = new Client({
        apiKey: '123',
        metadata: { section: { key: 'value' } },
        featureFlags: [{ name: 'abc' }, { name: 'xyz', variant: '123' }],
        context: 'renderer config',
        user: { id: 'ab23' }
      }, undefined, [clientStateUpdatesPlugin(mockBugsnagIpcRenderer)])

      expect(client._metadata).toEqual({})
      expect(client._user).toEqual({})
      expect(client._features).toStrictEqual([])
      expect(client._context).toEqual(undefined)
    })

    it('starts sessions', () => {
      const mockBugsnagIpcRenderer = { startSession: jest.fn() }

      const client = new Client({ apiKey: '123' }, {}, [clientStateUpdatesPlugin(mockBugsnagIpcRenderer)], Notifier)
      const returnValue = client.startSession()
      expect(mockBugsnagIpcRenderer.startSession).toHaveBeenCalled()
      expect(returnValue).toBe(client)
    })

    it('pauses sessions', () => {
      const mockBugsnagIpcRenderer = { pauseSession: jest.fn() }

      const client = new Client({ apiKey: '123' }, {}, [clientStateUpdatesPlugin(mockBugsnagIpcRenderer)], Notifier)
      client.pauseSession()
      expect(mockBugsnagIpcRenderer.pauseSession).toHaveBeenCalled()
    })

    it('resumes sessions', () => {
      const mockBugsnagIpcRenderer = { resumeSession: jest.fn() }

      const client = new Client({ apiKey: '123' }, {}, [clientStateUpdatesPlugin(mockBugsnagIpcRenderer)], Notifier)
      const returnValue = client.resumeSession()
      expect(mockBugsnagIpcRenderer.resumeSession).toHaveBeenCalled()
      expect(returnValue).toBe(client)
    })
  })
})
