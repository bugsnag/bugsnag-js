/* eslint-disable no-global-assign */

// this import is only for TS; we have to use some trickery to get a fresh copy
// of Bugsnag for each test
import ElectronBugsnagStatic, {
  Breadcrumb,
  Event,
  Session
} from '..'

// TODO this is require-d by 'config/main.js' but isn't in package.json
jest.mock('electron', () => ({
  app: {
    on () {}
  },
  ipcMain: {
    on () {},
    handle () {}
  }
}), { virtual: true })

describe('@bugsnag/electron types', () => {
  let Bugsnag: typeof ElectronBugsnagStatic

  beforeEach(() => {
    jest.isolateModules(() => { Bugsnag = require('..') })
  })

  // we reassign console in some tests to assert that bugsnag started
  const actualConsole = console
  afterEach(() => { console = actualConsole })

  describe('renderer', () => {
    beforeEach(() => {
      ;(window as any).__bugsnag_ipc__ = {
        config: {
          apiKey: 'abababababababababababababababab',
          metadata: {}
        },
        listen () {},
        update () {}
      }
    })

    // TODO this would ideally not be allowed but is currently possible
    it('can be started with an API key', () => {
      ;(console as any) = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
      }

      Bugsnag.start('abababababababababababababababab')

      expect(console.info).not.toHaveBeenCalled()
      expect(console.warn).toHaveBeenCalledWith('[bugsnag] Cannot set "apiKey" configuration option in renderer. This must be set in the main process.')
      expect(console.error).not.toHaveBeenCalled()
      expect(console.debug).toHaveBeenCalledWith('[bugsnag]', 'Loaded! In renderer process.')
    })

    it('can be started with no properties specified', () => {
      ;(console as any) = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
      }

      Bugsnag.start()

      expect(console.info).not.toHaveBeenCalled()
      expect(console.warn).not.toHaveBeenCalled()
      expect(console.error).not.toHaveBeenCalled()
      expect(console.debug).toHaveBeenCalledWith('[bugsnag]', 'Loaded! In renderer process.')
    })

    it('can be started with all properties specified', () => {
      const logger = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
      }

      Bugsnag.start({
        context: 'contextual',
        logger,
        metadata: { a: 1, b: 'yes', c: { d: [] } },
        onError: (event: Event) => {},
        onBreadcrumb: (breadcrumb: Breadcrumb) => {},
        plugins: [],
        user: { id: '1234-abcd' }
      })

      expect(logger.info).not.toHaveBeenCalled()
      expect(logger.warn).not.toHaveBeenCalled()
      expect(logger.error).not.toHaveBeenCalled()
      expect(logger.debug).toHaveBeenCalledWith('Loaded! In renderer process.')
    })
  })

  describe('main', () => {
    let Bugsnag: typeof ElectronBugsnagStatic

    beforeEach(() => {
      ;(process as any) = {
        type: 'browser',
        env: {},
        pid: Math.floor(Math.random() * 1000),
        cwd: () => '/a/b/c'
      }

      jest.isolateModules(() => { Bugsnag = require('..') })
    })

    it('can be started with an API key', () => {
      ;(console as any) = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
      }

      Bugsnag.start('abababababababababababababababab')

      expect(console.info).not.toHaveBeenCalled()
      expect(console.warn).not.toHaveBeenCalled()
      expect(console.error).not.toHaveBeenCalled()
      expect(console.debug).toHaveBeenCalledWith('[bugsnag][main]', 'Loaded! In main process.')
    })

    // TODO this would ideally not be allowed at compile time but is currently possible
    it('can be started with no properties specified', () => {
      expect(() => { Bugsnag.start() }).toThrow('No Bugsnag API Key set')
    })

    it('can be started with all properties specified', () => {
      const logger = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
      }

      Bugsnag.start({
        apiKey: 'abababababababababababababababab',
        appType: 'good',
        appVersion: '12312312',
        autoDetectErrors: true,
        autoTrackSessions: true,
        context: 'contextual',
        enabledBreadcrumbTypes: [
          'navigation',
          'request',
          'process',
          'log',
          'user',
          'state',
          'error',
          'manual'
        ],
        enabledErrorTypes: {
          unhandledExceptions: true,
          unhandledRejections: false,
          nativeCrashes: true
        },
        enabledReleaseStages: ['vOv', 'VoV'],
        endpoints: {
          notify: 'notify.example.com',
          sessions: 'sessions.example.com',
          minidumps: 'minidumps.example.com'
        },
        idleThreshold: 123,
        logger,
        maxBreadcrumbs: 28,
        metadata: { a: 1, b: 'yes', c: { d: [] } },
        onBreadcrumb: (breadcrumb: Breadcrumb) => {},
        onError: (event: Event) => {},
        onSession: (session: Session) => {},
        plugins: [],
        redactedKeys: ['b'],
        releaseStage: 'vOv',
        user: { id: '1234-abcd' }
      })

      expect(logger.info).not.toHaveBeenCalled()
      expect(logger.warn).not.toHaveBeenCalled()
      expect(logger.error).not.toHaveBeenCalled()
      expect(logger.debug).toHaveBeenCalledWith('Loaded! In main process.')
    })
  })
})
