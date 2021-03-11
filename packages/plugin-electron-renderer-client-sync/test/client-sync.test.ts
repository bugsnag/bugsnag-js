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
    listener({}, { type: 'AddMetadata', payload: { section: 'section', keyOrValues: 'key', value: 123 } })
    expect(client.getMetadata('section')).toEqual({ key: 123 })

    // clear metadata
    listener({}, { type: 'ClearMetadata', payload: { section: 'section' } })
    expect(client.getMetadata('section')).toEqual(undefined)
  })

  describe('propagates changes to the IPC layer', () => {
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
      expect(mockBugsnagIpcRenderer.updateUser).toHaveBeenCalledWith('123', 'jim@jim.com', 'Jim')
    })

    it('propagates metadata changes', () => {
      const mockBugsnagIpcRenderer = {
        listen: jest.fn(),
        addMetadata: jest.fn(),
        clearMetadata: jest.fn()
      }
      const client = new Client({}, {}, [clientSyncPlugin(mockBugsnagIpcRenderer)], {})

      client.addMetadata('section', 'key', 123)
      expect(client.getMetadata('section')).toEqual({ key: 123 })
      expect(mockBugsnagIpcRenderer.addMetadata).toHaveBeenCalledWith('section', 'key', 123)

      client.clearMetadata('section', 'key')
      expect(client.getMetadata('section')).toEqual({})
      expect(mockBugsnagIpcRenderer.clearMetadata).toHaveBeenCalledWith('section', 'key')
      client.clearMetadata('section')
      expect(client.getMetadata('section')).toEqual(undefined)
      expect(mockBugsnagIpcRenderer.clearMetadata).toHaveBeenCalledWith('section')
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
  })
})
