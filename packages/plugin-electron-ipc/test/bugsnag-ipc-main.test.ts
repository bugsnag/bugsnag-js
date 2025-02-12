import BugsnagIpcMain from '../bugsnag-ipc-main'
import { Client, User, Plugin, Event, FeatureFlag } from '@bugsnag/core'

const mockClientStateManagerPlugin = {
  name: 'clientStateManager',
  load: () => ({})
}

afterEach(() => jest.clearAllMocks())

const Notifier = {
  name: 'Bugsnag Electron Test',
  version: '0.0.0',
  url: 'https://github.com/bugsnag/bugsnag-js'
}

describe('BugsnagIpcMain', () => {
  describe('constructor()', () => {
    it('should throw if the state manager plugin is not loaded first', () => {
      const client = new Client({ apiKey: '123' }, {}, [], Notifier)
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const bugsnagIpcMain = new BugsnagIpcMain(client)
      }).toThrowError('Expected @bugsnag/plugin-electron-client-state-manager to be loaded first')
    })
    it('should work when the state manager plugin is loaded first', () => {
      const client = new Client({ apiKey: '123' }, {}, [mockClientStateManagerPlugin], Notifier)
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const bugsnagIpcMain = new BugsnagIpcMain(client)
      }).not.toThrowError('Expected @bugsnag/plugin-electron-client-state-manager to be loaded first')
    })
  })

  describe('handle()', () => {
    it('works for updating context', () => {
      const client = new Client({ apiKey: '123' }, {}, [mockClientStateManagerPlugin], Notifier)
      client.setContext = jest.fn()
      const bugsnagIpcMain = new BugsnagIpcMain(client)
      bugsnagIpcMain.handle({}, 'setContext', JSON.stringify('new context'))
      expect(client.setContext).toHaveBeenCalledWith('new context')
    })

    it('returns the current context', () => {
      const client = new Client({ apiKey: '123' }, {}, [mockClientStateManagerPlugin], Notifier)
      client.setContext('today')
      const bugsnagIpcMain = new BugsnagIpcMain(client)
      const event = { returnValue: undefined }
      bugsnagIpcMain.handleSync(event, 'getContext')
      expect(event.returnValue).toEqual('today')
    })

    it('works for updating user', () => {
      const client = new Client({ apiKey: '123' }, {}, [mockClientStateManagerPlugin], Notifier)
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
      const client = new Client({ apiKey: '123' }, {}, [mockClientStateManagerPlugin], Notifier)
      client.setUser('81676', undefined, 'Cal')
      const bugsnagIpcMain = new BugsnagIpcMain(client)
      const event = { returnValue: undefined }
      bugsnagIpcMain.handleSync(event, 'getUser')
      expect(event.returnValue).toEqual({ id: '81676', email: undefined, name: 'Cal' })
    })

    it('works for adding metadata', () => {
      const client = new Client({ apiKey: '123' }, {}, [mockClientStateManagerPlugin], Notifier)
      client.addMetadata = jest.fn()
      const bugsnagIpcMain = new BugsnagIpcMain(client)
      const stubWebContents = { /* this would be a WebContents instance */ }
      // a whole tab
      bugsnagIpcMain.handle({ sender: stubWebContents }, 'addMetadata', JSON.stringify('section'), JSON.stringify({ a: 123, b: 234 }))
      expect(client.addMetadata).toHaveBeenCalledWith('section', { a: 123, b: 234 })
    })

    it('works for removing metadata', () => {
      const client = new Client({ apiKey: '123' }, {}, [mockClientStateManagerPlugin], Notifier)
      client.clearMetadata = jest.fn()
      const bugsnagIpcMain = new BugsnagIpcMain(client)
      bugsnagIpcMain.handle({}, 'clearMetadata', JSON.stringify('section'))
      expect(client.clearMetadata).toHaveBeenCalledWith('section')
    })

    it('returns metadata content', () => {
      const client = new Client({ apiKey: '123' }, {}, [mockClientStateManagerPlugin], Notifier)
      client.addMetadata('section', 'content', 'X')
      const bugsnagIpcMain = new BugsnagIpcMain(client)
      const event = { returnValue: undefined }

      bugsnagIpcMain.handleSync(event, 'getMetadata', JSON.stringify('section'))
      expect(event.returnValue).toEqual({ content: 'X' })

      event.returnValue = undefined
      bugsnagIpcMain.handleSync(event, 'getMetadata', JSON.stringify('section'), JSON.stringify('content'))
      expect(event.returnValue).toEqual('X')
    })

    it('works for adding a single feature flag', () => {
      const client = new Client({ apiKey: '123' }, {}, [mockClientStateManagerPlugin], Notifier)
      client.addFeatureFlag = jest.fn()

      const bugsnagIpcMain = new BugsnagIpcMain(client)
      const stubWebContents = { /* this would be a WebContents instance */ }

      bugsnagIpcMain.handle({ sender: stubWebContents }, 'addFeatureFlag', JSON.stringify('flag name'), JSON.stringify('variant value'))

      expect(client.addFeatureFlag).toHaveBeenCalledWith('flag name', 'variant value')
    })

    it('works for adding multiple feature flags', () => {
      const client = new Client({ apiKey: '123' }, {}, [mockClientStateManagerPlugin], Notifier)
      client.addFeatureFlags = jest.fn()

      const bugsnagIpcMain = new BugsnagIpcMain(client)
      const stubWebContents = { /* this would be a WebContents instance */ }

      bugsnagIpcMain.handle(
        { sender: stubWebContents },
        'addFeatureFlags',
        JSON.stringify([{ name: 'abc', variant: '123' }, { name: 'xyz', variant: '987' }, { name: 'ooo' }])
      )

      expect(client.addFeatureFlags).toHaveBeenCalledWith([
        { name: 'abc', variant: '123' },
        { name: 'xyz', variant: '987' },
        { name: 'ooo' }
      ])
    })

    it('works for clearing a single feature flag', () => {
      const client = new Client({ apiKey: '123' }, {}, [mockClientStateManagerPlugin], Notifier)
      client.clearFeatureFlag = jest.fn()

      const bugsnagIpcMain = new BugsnagIpcMain(client)
      const stubWebContents = { /* this would be a WebContents instance */ }

      bugsnagIpcMain.handle({ sender: stubWebContents }, 'clearFeatureFlag', JSON.stringify('flag name'))

      expect(client.clearFeatureFlag).toHaveBeenCalledWith('flag name')
    })

    it('works for clearing all feature flags', () => {
      const client = new Client({ apiKey: '123' }, {}, [mockClientStateManagerPlugin], Notifier)
      client.clearFeatureFlags = jest.fn()

      const bugsnagIpcMain = new BugsnagIpcMain(client)
      const stubWebContents = { /* this would be a WebContents instance */ }

      bugsnagIpcMain.handle({ sender: stubWebContents }, 'clearFeatureFlags')

      expect(client.clearFeatureFlags).toHaveBeenCalled()
    })

    it('works for managing sessions', () => {
      const client = new Client({ apiKey: '123' }, {}, [mockClientStateManagerPlugin], Notifier)
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
      const client = new Client({ apiKey: '123' }, {}, [mockClientStateManagerPlugin], Notifier)
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
      const client = new Client({ apiKey: '123' }, {}, [{
        name: 'clientStateManager',
        load: () => ({
          bulkUpdate: ({ context, user, metadata, features }: { context?: string, user?: User, metadata: Record<string, unknown>, features: FeatureFlag | null[]}) => {
            expect(context).toEqual('current context')
            expect(user).toEqual({ name: 'merrich' })
            expect(metadata).toEqual({ electron: { procs: 3 } })
            expect(features).toEqual([{ name: 'flag1', variant: 'variant1' }, { name: 'flag2', variant: null }])
            done()
          }
        })
      }], Notifier)

      const bugsnagIpcMain = new BugsnagIpcMain(client)

      bugsnagIpcMain.handle(
        {},
        'update',
        JSON.stringify({
          context: 'current context',
          user: { name: 'merrich' },
          metadata: { electron: { procs: 3 } },
          features: [{ name: 'flag1', variant: 'variant1' }, { name: 'flag2', variant: null }]
        })
      )
    })

    it('is resilient to unknown methods', () => {
      const client = new Client({ apiKey: '123' }, {}, [mockClientStateManagerPlugin], Notifier)
      const bugsnagIpcMain = new BugsnagIpcMain(client)
      expect(() => bugsnagIpcMain.handle({}, 'explodePlease', JSON.stringify({ data: 123 }))).not.toThrowError()
    })

    it('is resilient to bad JSON', () => {
      const client = new Client({ apiKey: '123' }, {}, [mockClientStateManagerPlugin], Notifier)
      const bugsnagIpcMain = new BugsnagIpcMain(client)
      expect(() => bugsnagIpcMain.handle({}, 'leaveBreadcrumb', 'not json')).not.toThrowError()
    })
  })

  describe('getPayloadInfo()', () => {
    it('should run an event through internal callbacks and return its properties', async () => {
      const internalPlugins: Plugin[] = [
        {
          load: (client) => {
            // mock an internal plugin that adds app data
            const cb = (event: Event) => {
              event.app = { ...event.app, name: 'testApp', type: 'test' }
              event.addMetadata('app', 'testingMode', 'unit')
            }
            cb._internal = true // simulate what @bugsnag/plugin-internal-callback-marker does
            client.addOnError(cb)
          }
        },
        {
          load: (client) => {
            // mock an internal plugin that adds device data
            const cb = (event: Event) => {
              event.device = { ...event.device, id: '123' }
              event.addMetadata('device', 'isOutdated', true)
            }
            cb._internal = true // simulate what @bugsnag/plugin-internal-callback-marker does
            client.addOnError(cb)
          }
        }
      ]

      const client = new Client({
        apiKey: '123'
      }, undefined, [...internalPlugins, mockClientStateManagerPlugin], Notifier)

      // add a non-internal callback and ensure it does not run
      const nonInternalCb = jest.fn((event) => {
        event.addMetadata('nonInternal', 'ran', true)
      })
      client.addOnError(nonInternalCb)

      client.leaveBreadcrumb('hi')
      client.setContext('ctx')
      client.setUser('123', 'jim@jim.com', 'Jim')
      client.addFeatureFlags([
        { name: 'flag1' },
        { name: 'flag2', variant: null },
        // @ts-ignore:
        { name: 'flag3', variant: 1234 },
        { name: 'flag4', variant: 'abc' }
      ])

      const bugsnagIpcMain = new BugsnagIpcMain(client)
      const payloadInfo = await bugsnagIpcMain.getPayloadInfo()

      expect(payloadInfo.metadata.nonInternal).toBeUndefined()
      expect(nonInternalCb).not.toHaveBeenCalled()
      expect(payloadInfo.breadcrumbs).toHaveLength(1)

      expect(payloadInfo).toStrictEqual({
        app: {
          releaseStage: 'production',
          name: 'testApp',
          type: 'test',
          version: undefined
        },
        breadcrumbs: client._breadcrumbs,
        context: 'ctx',
        device: { id: '123' },
        metadata: {
          app: { testingMode: 'unit' },
          device: { isOutdated: true }
        },
        features: [
          { name: 'flag1', variant: null },
          { name: 'flag2', variant: null },
          { name: 'flag3', variant: '1234' },
          { name: 'flag4', variant: 'abc' }
        ],
        user: {
          id: '123',
          email: 'jim@jim.com',
          name: 'Jim'
        }
      })
    })

    it('should return shouldSend=false when a callback returns false', async () => {
      const cb = jest.fn(() => false)
      // @ts-expect-error _internal is not a property of jest mocks but if we
      // set it on the callback and then wrap it, it isn't accessible
      cb._internal = true
      // plugin that returns false for all events
      const preventAllPlugin: Plugin = {
        load: (client) => {
          client.addOnError(cb)
        }
      }
      const client = new Client({
        apiKey: '123'
      }, undefined, [
        preventAllPlugin,
        mockClientStateManagerPlugin
      ], Notifier)

      const bugsnagIpcMain = new BugsnagIpcMain(client)
      const payloadInfo = await bugsnagIpcMain.getPayloadInfo()
      expect(payloadInfo).toEqual({ shouldSend: false })
      expect(cb).toHaveBeenCalledTimes(1)
    })
  })

  describe('dispatch()', () => {
    it('should take a serialised event object, rehydrate it, run it through callbacks and send it', () => {
      const client = new Client({
        apiKey: '123'
      }, undefined, [
        mockClientStateManagerPlugin
      ], Notifier)

      // add an internal callback and ensure it does not run
      const internalCb = jest.fn((event) => {
        event.addMetadata('internal', 'ran', true)
      })
      // @ts-expect-error
      internalCb._internal = true
      client.addOnError(internalCb)

      // add a non-internal callback and ensure it runs
      const nonInternalCb = jest.fn((event) => {
        event.addMetadata('nonInternal', 'ran', true)
      })
      client.addOnError(nonInternalCb)

      const mockDelivery = { sendEvent: jest.fn(), sendSession: jest.fn() }
      client._setDelivery(client => mockDelivery)

      const bugsnagIpcMain = new BugsnagIpcMain(client)
      const event = new Event('Error', 'Something bad happened', [])
      bugsnagIpcMain.dispatch(Object.assign({}, event))

      expect(mockDelivery.sendEvent).toHaveBeenCalledWith(expect.objectContaining({
        apiKey: '123',
        notifier: expect.any(Object),
        events: [
          expect.objectContaining({
            context: undefined,
            errors: [
              expect.objectContaining({
                errorClass: 'Error',
                errorMessage: 'Something bad happened',
                stacktrace: []
              })
            ],
            _metadata: {
              nonInternal: { ran: true }
            }
          })
        ]
      }))

      expect(internalCb).not.toHaveBeenCalled()
      expect(nonInternalCb).toHaveBeenCalledTimes(1)
    })
  })
})
