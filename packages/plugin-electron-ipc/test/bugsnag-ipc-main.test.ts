import BugsnagIpcMain from '../bugsnag-ipc-main'
import Client from '@bugsnag/core/client'

const mockStateSyncPlugin = {
  name: 'stateSync',
  load: () => ({})
}

const mockEventSyncPlugin = {
  name: 'mainEventSync',
  load: () => ({})
}

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
    it('should throw if the main event sync plugin is not loaded first', () => {
      const client = new Client({}, {}, [mockStateSyncPlugin], {})
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const bugsnagIpcMain = new BugsnagIpcMain(client)
      }).toThrowError('Expected @bugsnag/plugin-electron-event-sync to be loaded first')
    })
    it('should work when the state sync plugin is loaded first', () => {
      const client = new Client({}, {}, [mockStateSyncPlugin, mockEventSyncPlugin], {})
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const bugsnagIpcMain = new BugsnagIpcMain(client)
      }).not.toThrowError('Expected @bugsnag/plugin-electron-state-sync to be loaded first')
    })
  })

  describe('handle()', () => {
    it('works for updating context', () => {
      const client = new Client({}, {}, [mockStateSyncPlugin, mockEventSyncPlugin], {})
      client.setContext = jest.fn()
      const bugsnagIpcMain = new BugsnagIpcMain(client)
      bugsnagIpcMain.handle({}, 'setContext', JSON.stringify('new context'))
      expect(client.setContext).toHaveBeenCalledWith('new context')
    })

    it('returns the current context', () => {
      const client = new Client({}, {}, [mockStateSyncPlugin, mockEventSyncPlugin], {})
      client.setContext('today')
      const bugsnagIpcMain = new BugsnagIpcMain(client)
      const event = { returnValue: undefined }
      bugsnagIpcMain.handleSync(event, 'getContext')
      expect(event.returnValue).toEqual('today')
    })

    it('works for updating user', () => {
      const client = new Client({}, {}, [mockStateSyncPlugin, mockEventSyncPlugin], {})
      client.setUser = jest.fn()
      const bugsnagIpcMain = new BugsnagIpcMain(client)
      // all fields set
      bugsnagIpcMain.handle({}, 'setUser', JSON.stringify('123'), JSON.stringify('jim@jim.com'), JSON.stringify('Jim'))
      expect(client.setUser).toHaveBeenCalledWith('123', 'jim@jim.com', 'Jim')
      // some fields not set
      bugsnagIpcMain.handle({}, 'setUser', JSON.stringify('123'), undefined, JSON.stringify('Jim'))
      expect(client.setUser).toHaveBeenCalledWith('123', undefined, 'Jim')
    })

    it('returns the current user', () => {
      const client = new Client({}, {}, [mockStateSyncPlugin, mockEventSyncPlugin], {})
      client.setUser('81676', null, 'Cal')
      const bugsnagIpcMain = new BugsnagIpcMain(client)
      const event = { returnValue: undefined }
      bugsnagIpcMain.handleSync(event, 'getUser')
      expect(event.returnValue).toEqual({ id: '81676', email: null, name: 'Cal' })
    })

    it('works for adding metadata', () => {
      const client = new Client({}, {}, [mockStateSyncPlugin, mockEventSyncPlugin], {})
      client.addMetadata = jest.fn()
      const bugsnagIpcMain = new BugsnagIpcMain(client)
      const stubWebContents = { /* this would be a WebContents instance */ }
      // a whole tab
      bugsnagIpcMain.handle({ sender: stubWebContents }, 'addMetadata', JSON.stringify('section'), JSON.stringify({ a: 123, b: 234 }))
      expect(client.addMetadata).toHaveBeenCalledWith('section', { a: 123, b: 234 })
    })

    it('works for removing metadata', () => {
      const client = new Client({}, {}, [mockStateSyncPlugin, mockEventSyncPlugin], {})
      client.clearMetadata = jest.fn()
      const bugsnagIpcMain = new BugsnagIpcMain(client)
      bugsnagIpcMain.handle({}, 'clearMetadata', JSON.stringify('section'))
      expect(client.clearMetadata).toHaveBeenCalledWith('section')
    })

    it('returns metadata content', () => {
      const client = new Client({}, {}, [mockStateSyncPlugin, mockEventSyncPlugin], {})
      client.addMetadata('section', 'content', 'X')
      const bugsnagIpcMain = new BugsnagIpcMain(client)
      const event = { returnValue: undefined }

      bugsnagIpcMain.handleSync(event, 'getMetadata', JSON.stringify('section'))
      expect(event.returnValue).toEqual({ content: 'X' })

      event.returnValue = undefined
      bugsnagIpcMain.handleSync(event, 'getMetadata', JSON.stringify('section'), JSON.stringify('content'))
      expect(event.returnValue).toEqual('X')
    })

    it('works for managing sessions', () => {
      const client = new Client({}, {}, [mockStateSyncPlugin, mockEventSyncPlugin], {})
      client._sessionDelegate = { startSession: jest.fn(), resumeSession: jest.fn(), pauseSession: jest.fn() }
      const bugsnagIpcMain = new BugsnagIpcMain(client)
      // start
      bugsnagIpcMain.handle({}, 'startSession')
      expect(client._sessionDelegate.startSession).toHaveBeenCalled()
      // resume
      bugsnagIpcMain.handle({}, 'resumeSession')
      expect(client._sessionDelegate.resumeSession).toHaveBeenCalled()
      // pause
      bugsnagIpcMain.handle({}, 'pauseSession')
      expect(client._sessionDelegate.pauseSession).toHaveBeenCalled()
    })

    it('works for breadcrumbs', (done) => {
      const client = new Client({}, {}, [mockStateSyncPlugin, mockEventSyncPlugin], {})
      client.addOnBreadcrumb(b => {
        expect(b.message).toBe('hi IPC')
        expect(b.type).toBe('manual')
        expect(b.metadata).toEqual({ electron: 'has many processes' })
        done()
      })
      const bugsnagIpcMain = new BugsnagIpcMain(client)
      bugsnagIpcMain.handle(
        {},
        'leaveBreadcrumb',
        JSON.stringify({ message: 'hi IPC', type: 'manual', metadata: { electron: 'has many processes' } })
      )
    })

    it('works for bulk updates', done => {
      const client = new Client({}, {}, [{
        name: 'stateSync',
        load: () => ({
          bulkUpdate: ({ context, user, metadata }) => {
            expect(context).toEqual('current context')
            expect(user).toEqual({ name: 'merrich' })
            expect(metadata).toEqual({ electron: { procs: 3 } })
            done()
          }
        })
      }, mockEventSyncPlugin], {})
      const bugsnagIpcMain = new BugsnagIpcMain(client)
      bugsnagIpcMain.handle(
        {},
        'update',
        JSON.stringify({ context: 'current context', user: { name: 'merrich' }, metadata: { electron: { procs: 3 } } })
      )
    })

    it('is resilient to unknown methods', () => {
      const client = new Client({}, {}, [mockStateSyncPlugin, mockEventSyncPlugin], {})
      const bugsnagIpcMain = new BugsnagIpcMain(client)
      expect(() => bugsnagIpcMain.handle({}, 'explodePlease', JSON.stringify({ data: 123 }))).not.toThrowError()
    })

    it('is resilient to bad JSON', () => {
      const client = new Client({}, {}, [mockStateSyncPlugin, mockEventSyncPlugin], {})
      const bugsnagIpcMain = new BugsnagIpcMain(client)
      expect(() => bugsnagIpcMain.handle({}, 'leaveBreadcrumb', 'not json')).not.toThrowError()
    })
  })
})
