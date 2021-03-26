import clientSyncPlugin from '../client-sync'
import Client from '@bugsnag/core/client'

describe('clientSyncPlugin', () => {
  describe('propagation of changes to the IPC layer', () => {
    it('propagates context changes', () => {
      const mockBugsnagIpcRenderer = {
        setContext: jest.fn()
      }
      const client = new Client({}, {}, [clientSyncPlugin(mockBugsnagIpcRenderer)], {})

      client.setContext('ctx')
      expect(mockBugsnagIpcRenderer.setContext).toHaveBeenCalledWith('ctx')
    })

    it('forwards upstream changes to context', () => {
      const mockBugsnagIpcRenderer = {
        getContext: () => 'ctx'
      }
      const client = new Client({}, {}, [clientSyncPlugin(mockBugsnagIpcRenderer)], {})
      expect(client.getContext()).toBe('ctx')
    })

    it('propagates user changes', () => {
      const mockBugsnagIpcRenderer = {
        setUser: jest.fn()
      }
      const client = new Client({}, {}, [clientSyncPlugin(mockBugsnagIpcRenderer)], {})

      client.setUser('123', 'jim@jim.com', 'Jim')
      expect(mockBugsnagIpcRenderer.setUser).toHaveBeenCalledWith('123', 'jim@jim.com', 'Jim')
    })

    it('forwards upstream changes to user', () => {
      const mockBugsnagIpcRenderer = {
        getUser: () => { return { id: '123', email: 'jim@jim.com', name: 'Jim' } }
      }
      const client = new Client({}, {}, [clientSyncPlugin(mockBugsnagIpcRenderer)], {})

      expect(client.getUser()).toEqual({ id: '123', email: 'jim@jim.com', name: 'Jim' })
    })

    it('propagates metadata changes', () => {
      const mockBugsnagIpcRenderer = {
        addMetadata: jest.fn(),
        clearMetadata: jest.fn()
      }
      const client = new Client({}, {}, [clientSyncPlugin(mockBugsnagIpcRenderer)], {})

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
      const client = new Client({}, {}, [clientSyncPlugin(mockBugsnagIpcRenderer)], {})
      client.getMetadata('layers', 'strawberry')
    })

    it('propagates breadcrumb changes', () => {
      const mockBugsnagIpcRenderer = {
        leaveBreadcrumb: jest.fn()
      }
      const client = new Client({}, {}, [clientSyncPlugin(mockBugsnagIpcRenderer)], {})
      client.leaveBreadcrumb('hi')
      expect(mockBugsnagIpcRenderer.leaveBreadcrumb).toHaveBeenCalledWith(expect.objectContaining({
        message: 'hi',
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
      const client = new Client({}, {}, [clientSyncPlugin(mockBugsnagIpcRenderer)], {})
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
        context: 'renderer config',
        user: { id: 'ab23' }
      }, undefined, [clientSyncPlugin(mockBugsnagIpcRenderer)])

      expect(mockBugsnagIpcRenderer.update).toHaveBeenCalledWith({
        metadata: { section: { key: 'value' } },
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
      }, undefined, [clientSyncPlugin(mockBugsnagIpcRenderer)])

      expect(mockBugsnagIpcRenderer.update).toHaveBeenCalledWith({
        metadata: { section: { key: 'value' } }
      })
    })
  })
})
