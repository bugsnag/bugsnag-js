import BugsnagIpcMain from '../bugsnag-ipc-main'
import Client from '@bugsnag/core/client'

const mockStateSyncPlugin = {
  name: 'stateSync',
  load: () => ({
    setContextFromSource: jest.fn(() => mockSetContext),
    setUserFromSource: jest.fn(() => mockSetUser),
    addMetadataFromSource: jest.fn(() => mockAddMetadata),
    clearMetadataFromSource: jest.fn(() => mockClearMetadata)
  })
}

const mockSetContext = jest.fn()
const mockSetUser = jest.fn()
const mockAddMetadata = jest.fn()
const mockClearMetadata = jest.fn()

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
      bugsnagIpcMain.handle({ sender: stubWebContents }, 'updateContext', JSON.stringify('new context'))
      expect(client.getPlugin('stateSync').setContextFromSource).toHaveBeenCalledWith(stubWebContents)
      expect(mockSetContext).toHaveBeenCalledWith('new context')
    })

    it('works for updating user', () => {
      const client = new Client({}, {}, [mockStateSyncPlugin], {})
      const bugsnagIpcMain = new BugsnagIpcMain(client)
      const stubWebContents = { /* this would be a WebContents instance */ }
      // all fields set
      bugsnagIpcMain.handle({ sender: stubWebContents }, 'updateUser', JSON.stringify('123'), JSON.stringify('jim@jim.com'), JSON.stringify('Jim'))
      expect(client.getPlugin('stateSync').setUserFromSource).toHaveBeenCalledWith(stubWebContents)
      expect(mockSetUser).toHaveBeenCalledWith('123', 'jim@jim.com', 'Jim')
      // some fields not set
      bugsnagIpcMain.handle({ sender: stubWebContents }, 'updateUser', JSON.stringify('123'), undefined, JSON.stringify('Jim'))
      expect(client.getPlugin('stateSync').setUserFromSource).toHaveBeenCalledWith(stubWebContents)
      expect(mockSetUser).toHaveBeenCalledWith('123', undefined, 'Jim')
    })

    it('works for adding metadata', () => {
      const client = new Client({}, {}, [mockStateSyncPlugin], {})
      const bugsnagIpcMain = new BugsnagIpcMain(client)
      const stubWebContents = { /* this would be a WebContents instance */ }
      // a single value
      bugsnagIpcMain.handle({ sender: stubWebContents }, 'addMetadata', JSON.stringify('section'), JSON.stringify('key'), JSON.stringify(123))
      expect(client.getPlugin('stateSync').addMetadataFromSource).toHaveBeenCalledWith(stubWebContents)
      expect(mockAddMetadata).toHaveBeenCalledWith('section', 'key', 123)
      // a whole tab
      bugsnagIpcMain.handle({ sender: stubWebContents }, 'addMetadata', JSON.stringify('section'), JSON.stringify({ a: 123, b: 234 }))
      expect(client.getPlugin('stateSync').addMetadataFromSource).toHaveBeenCalledWith(stubWebContents)
      expect(mockAddMetadata).toHaveBeenCalledWith('section', { a: 123, b: 234 })
    })

    it('works for removing metadata', () => {
      const client = new Client({}, {}, [mockStateSyncPlugin], {})
      const bugsnagIpcMain = new BugsnagIpcMain(client)
      const stubWebContents = { /* this would be a WebContents instance */ }
      // a single value
      bugsnagIpcMain.handle({ sender: stubWebContents }, 'clearMetadata', JSON.stringify('section'), JSON.stringify('key'), JSON.stringify(123))
      expect(client.getPlugin('stateSync').clearMetadataFromSource).toHaveBeenCalledWith(stubWebContents)
      expect(mockClearMetadata).toHaveBeenCalledWith('section', 'key', 123)
      // a whole tab
      bugsnagIpcMain.handle({ sender: stubWebContents }, 'clearMetadata', JSON.stringify('section'))
      expect(client.getPlugin('stateSync').clearMetadataFromSource).toHaveBeenCalledWith(stubWebContents)
      expect(mockClearMetadata).toHaveBeenCalledWith('section')
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
        console.log(b)
        expect(b.message).toBe('hi IPC')
        expect(b.type).toBe('manual')
        expect(b.metadata).toEqual({ electron: 'has many processes' })
        done()
      })
      const bugsnagIpcMain = new BugsnagIpcMain(client)
      const stubWebContents = { /* this would be a WebContents instance */ }
      bugsnagIpcMain.handle({ sender: stubWebContents }, 'leaveBreadcrumb', JSON.stringify({ name: 'hi IPC', type: 'manual', metaData: { electron: 'has many processes' } }))
    })

    it('is resilient to unknown methods', () => {
      const client = new Client({}, {}, [mockStateSyncPlugin], {})
      const bugsnagIpcMain = new BugsnagIpcMain(client)
      const stubWebContents = { /* this would be a WebContents instance */ }
      expect(() => bugsnagIpcMain.handle({ sender: stubWebContents }, 'explodePlease', JSON.stringify({ data: 123 }))).not.toThrowError()
    })

    it('is resiliant to bad JSON', () => {
      const client = new Client({}, {}, [mockStateSyncPlugin], {})
      const bugsnagIpcMain = new BugsnagIpcMain(client)
      const stubWebContents = { /* this would be a WebContents instance */ }
      expect(() => bugsnagIpcMain.handle({ sender: stubWebContents }, 'leaveBreadcrumb', 'not json')).not.toThrowError()
    })
  })
})
