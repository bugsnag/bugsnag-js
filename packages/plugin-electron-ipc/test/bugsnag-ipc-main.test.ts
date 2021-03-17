import BugsnagIpcMain from '../bugsnag-ipc-main'
import Client from '@bugsnag/core/client'

const mockStateSyncPlugin = {
  name: 'stateSync',
  load: () => ({
    updateContextFromSource: jest.fn(() => mockUpdateContext),
    updateUserFromSource: jest.fn(() => mockUpdateUser),
    updateMetadataFromSource: jest.fn(() => mockUpdateMetadata)
  })
}

const mockUpdateContext = jest.fn()
const mockUpdateUser = jest.fn()
const mockUpdateMetadata = jest.fn()

afterEach(() => jest.clearAllMocks())

describe('BugsnagIpcMain', () => {
  describe('constructor()', () => {
    it('should throw if the state sync plugin is not loaded first', () => {
      const client = new Client({}, {}, [], {})
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const bugsnagIpcMain = new BugsnagIpcMain(client)
      }).toThrowError('Expected @bugsnag/plugin-electron-state-sync to be loaded first')
    })
    it('should work when the state sync plugin is loaded first', () => {
      const client = new Client({}, {}, [mockStateSyncPlugin], {})
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const bugsnagIpcMain = new BugsnagIpcMain(client)
      }).not.toThrowError('Expected @bugsnag/plugin-electron-state-sync to be loaded first')
    })
  })

  describe('handle()', () => {
    it('works for updating context', () => {
      const client = new Client({}, {}, [mockStateSyncPlugin], {})
      const bugsnagIpcMain = new BugsnagIpcMain(client)
      const stubWebContents = { /* this would be a WebContents instance */ }
      bugsnagIpcMain.handle({ sender: stubWebContents }, 'updateContext', JSON.stringify({ context: 'new context' }))
      expect(client.getPlugin('stateSync').updateContextFromSource).toHaveBeenCalledWith(stubWebContents)
      expect(mockUpdateContext).toHaveBeenCalledWith({ context: 'new context' })
    })

    it('works for updating user', () => {
      const client = new Client({}, {}, [mockStateSyncPlugin], {})
      const bugsnagIpcMain = new BugsnagIpcMain(client)
      const stubWebContents = { /* this would be a WebContents instance */ }
      // all fields set
      bugsnagIpcMain.handle({ sender: stubWebContents }, 'updateUser', JSON.stringify({ user: { id: '123', email: 'jim@jim.com', name: 'Jim' } }))
      expect(client.getPlugin('stateSync').updateUserFromSource).toHaveBeenCalledWith(stubWebContents)
      expect(mockUpdateUser).toHaveBeenCalledWith({ user: { id: '123', email: 'jim@jim.com', name: 'Jim' } })
      // some fields not set
      bugsnagIpcMain.handle({ sender: stubWebContents }, 'updateUser', JSON.stringify({ user: { id: '123', email: undefined, name: 'Jim' } }))
      expect(client.getPlugin('stateSync').updateUserFromSource).toHaveBeenCalledWith(stubWebContents)
      expect(mockUpdateUser).toHaveBeenCalledWith({ user: { id: '123', email: undefined, name: 'Jim' } })
    })

    it('works for adding metadata', () => {
      const client = new Client({}, {}, [mockStateSyncPlugin], {})
      const bugsnagIpcMain = new BugsnagIpcMain(client)
      const stubWebContents = { /* this would be a WebContents instance */ }
      // a whole tab
      bugsnagIpcMain.handle({ sender: stubWebContents }, 'updateMetadata', JSON.stringify({ section: 'section', values: { a: 123, b: 234 } }))
      expect(client.getPlugin('stateSync').updateMetadataFromSource).toHaveBeenCalledWith(stubWebContents)
      expect(mockUpdateMetadata).toHaveBeenCalledWith({ section: 'section', values: { a: 123, b: 234 } })
    })

    it('works for removing metadata', () => {
      const client = new Client({}, {}, [mockStateSyncPlugin], {})
      const bugsnagIpcMain = new BugsnagIpcMain(client)
      const stubWebContents = { /* this would be a WebContents instance */ }
      bugsnagIpcMain.handle({ sender: stubWebContents }, 'updateMetadata', JSON.stringify({ section: 'section', values: undefined }))
      expect(client.getPlugin('stateSync').updateMetadataFromSource).toHaveBeenCalledWith(stubWebContents)
      expect(mockUpdateMetadata).toHaveBeenCalledWith({ section: 'section', values: undefined })
    })

    it('works for managing sessions', () => {
      const client = new Client({}, {}, [mockStateSyncPlugin], {})
      client._sessionDelegate = { startSession: jest.fn(), resumeSession: jest.fn(), pauseSession: jest.fn() }
      const bugsnagIpcMain = new BugsnagIpcMain(client)
      const stubWebContents = { /* this would be a WebContents instance */ }
      // start
      bugsnagIpcMain.handle({ sender: stubWebContents }, 'startSession')
      expect(client._sessionDelegate.startSession).toHaveBeenCalled()
      // resume
      bugsnagIpcMain.handle({ sender: stubWebContents }, 'resumeSession')
      expect(client._sessionDelegate.resumeSession).toHaveBeenCalled()
      // pause
      bugsnagIpcMain.handle({ sender: stubWebContents }, 'pauseSession')
      expect(client._sessionDelegate.pauseSession).toHaveBeenCalled()
    })

    it('works for breadcrumbs', (done) => {
      const client = new Client({}, {}, [mockStateSyncPlugin], {})
      client.addOnBreadcrumb(b => {
        expect(b.message).toBe('hi IPC')
        expect(b.type).toBe('manual')
        expect(b.metadata).toEqual({ electron: 'has many processes' })
        done()
      })
      const bugsnagIpcMain = new BugsnagIpcMain(client)
      const stubWebContents = { /* this would be a WebContents instance */ }
      bugsnagIpcMain.handle(
        { sender: stubWebContents },
        'leaveBreadcrumb',
        JSON.stringify({ name: 'hi IPC', type: 'manual', metaData: { electron: 'has many processes' } })
      )
    })

    it('is resilient to unknown methods', () => {
      const client = new Client({}, {}, [mockStateSyncPlugin], {})
      const bugsnagIpcMain = new BugsnagIpcMain(client)
      const stubWebContents = { /* this would be a WebContents instance */ }
      expect(() => bugsnagIpcMain.handle({ sender: stubWebContents }, 'explodePlease', JSON.stringify({ data: 123 }))).not.toThrowError()
    })

    it('is resilient to bad JSON', () => {
      const client = new Client({}, {}, [mockStateSyncPlugin], {})
      const bugsnagIpcMain = new BugsnagIpcMain(client)
      const stubWebContents = { /* this would be a WebContents instance */ }
      expect(() => bugsnagIpcMain.handle({ sender: stubWebContents }, 'leaveBreadcrumb', 'not json')).not.toThrowError()
    })

    it('retrieves current state', async () => {
      const client = new Client({
        apiKey: 'api_key',
        metadata: { section: { key: 123 } },
        context: 'initial c',
        user: { id: '123' }
      }, undefined, [mockStateSyncPlugin], {})
      const bugsnagIpcMain = new BugsnagIpcMain(client)
      const stubWebContents = { /* this would be a WebContents instance */ }
      expect(await bugsnagIpcMain.handle({ sender: stubWebContents }, 'getCurrentState')).toEqual({
        metadata: { section: { key: 123 } },
        context: 'initial c',
        user: { id: '123' }
      })
    })
  })
})
