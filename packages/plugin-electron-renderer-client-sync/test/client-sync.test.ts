import clientSyncPlugin from '../client-sync'
import Client from '@bugsnag/core/client'

describe('clientSyncPlugin', () => {
  it('should listen for changes', () => {
    let listener
    const mockBugsnagIpcRenderer = {
      listen: jest.fn().mockImplementation((callback) => { listener = callback })
    }

    const client = new Client({}, {}, [clientSyncPlugin(mockBugsnagIpcRenderer)], {})
    expect(mockBugsnagIpcRenderer.listen).toHaveBeenCalledTimes(1)

    // update context
    listener({}, { type: 'ContextUpdate', payload: { context: 'new context' } })
    expect(client.getContext()).toBe('new context')

    // update user
    listener({}, { type: 'UserUpdate', payload: { user: { id: '123', email: 'jim@jim.com' } } })
    expect(client.getUser()).toEqual({ id: '123', email: 'jim@jim.com' })

    // add metadata
    listener({}, { type: 'MetadataUpdate', payload: { section: 'section', values: { key: 123 } } })
    expect(client.getMetadata('section')).toEqual({ key: 123 })

    // clear metadata
    listener({}, { type: 'MetadataUpdate', payload: { section: 'section' } })
    expect(client.getMetadata('section')).toEqual(undefined)
  })

  describe('propagation of changes to the IPC layer', () => {
    it('propagates context changes', () => {
      const mockBugsnagIpcRenderer = {
        listen: jest.fn(),
        updateContext: jest.fn()
      }
      const client = new Client({}, {}, [clientSyncPlugin(mockBugsnagIpcRenderer)], {})
      expect(mockBugsnagIpcRenderer.listen).toHaveBeenCalledTimes(1)

      client.setContext('ctx')
      expect(client.getContext()).toBe('ctx')
      expect(mockBugsnagIpcRenderer.updateContext).toHaveBeenCalledWith('ctx')
    })

    it('propagates user changes', () => {
      const mockBugsnagIpcRenderer = {
        listen: jest.fn(),
        updateUser: jest.fn()
      }
      const client = new Client({}, {}, [clientSyncPlugin(mockBugsnagIpcRenderer)], {})
      expect(mockBugsnagIpcRenderer.listen).toHaveBeenCalledTimes(1)

      client.setUser('123', 'jim@jim.com', 'Jim')
      expect(client.getUser()).toEqual({ id: '123', email: 'jim@jim.com', name: 'Jim' })
      expect(mockBugsnagIpcRenderer.updateUser).toHaveBeenCalledWith({ id: '123', email: 'jim@jim.com', name: 'Jim' })
    })

    it('propagates metadata changes', () => {
      const mockBugsnagIpcRenderer = {
        listen: jest.fn(),
        updateMetadata: jest.fn()
      }
      const client = new Client({}, {}, [clientSyncPlugin(mockBugsnagIpcRenderer)], {})

      client.addMetadata('section', { key0: 123, key1: 234 })
      expect(client.getMetadata('section')).toEqual({ key0: 123, key1: 234 })
      expect(mockBugsnagIpcRenderer.updateMetadata).toHaveBeenCalledWith('section', { key0: 123, key1: 234 })

      client.clearMetadata('section', 'key0')
      expect(client.getMetadata('section')).toEqual({ key1: 234 })
      expect(mockBugsnagIpcRenderer.updateMetadata).toHaveBeenCalledWith('section', { key1: 234 })
      client.clearMetadata('section')
      expect(client.getMetadata('section')).toEqual(undefined)
      expect(mockBugsnagIpcRenderer.updateMetadata).toHaveBeenCalledWith('section', undefined)
    })

    it('propagates breadcrumb changes', () => {
      const mockBugsnagIpcRenderer = {
        listen: jest.fn(),
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
        listen: jest.fn(),
        updateUser: jest.fn().mockImplementation(throwError),
        updateContext: jest.fn().mockImplementation(throwError),
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
        listen: jest.fn(),
        updateMetadata: jest.fn(),
        updateUser: jest.fn(),
        updateContext: jest.fn()
      }
      const client = new Client({
        apiKey: '123',
        metadata: { section: { key: 'value' } },
        context: 'renderer config',
        user: { id: 'ab23' }
      }, undefined, [clientSyncPlugin(mockBugsnagIpcRenderer)])
      expect(client.getMetadata('section')).toEqual({ key: 'value' })
      expect(mockBugsnagIpcRenderer.updateMetadata).toHaveBeenCalledWith('section', { key: 'value' })
      expect(client.getUser()).toEqual({ id: 'ab23' })
      expect(mockBugsnagIpcRenderer.updateUser).toHaveBeenCalledWith({ id: 'ab23' })
      expect(client.getContext()).toEqual('renderer config')
      expect(mockBugsnagIpcRenderer.updateContext).toHaveBeenCalledWith('renderer config')
    })
  })
})
