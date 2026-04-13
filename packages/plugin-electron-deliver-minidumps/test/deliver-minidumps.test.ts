import createPlugin from '../deliver-minidumps'

jest.mock('electron', () => ({
  crashReporter: {
    start: () => {}
  }
}))

describe('electron-minidump-delivery: load', () => {
  let whenReadyCallback: Function | undefined

  const app = {
    whenReady: () => ({ then (callback: Function) { whenReadyCallback = callback } }),
    on: jest.fn()
  }

  const net = {}

  const filestore = {
    getAppRunMetadata: () => ({ bugsnag_crash_id: 'abc123' }),
    getEventInfoPath: () => 'test-run-info-dir',
    getPaths: () => ({ lastRunInfo: 'last-run-info.json' })
  }

  const nativeClient = {
    install: jest.fn()
  }

  const plugin = createPlugin(app as any, net as any, filestore as any, nativeClient as any)

  afterEach(() => { whenReadyCallback = undefined })

  it('should install when configured', () => {
    const client = {
      _config: {
        autoDetectErrors: true,
        enabledErrorTypes: {
          nativeCrashes: true
        },
        endpoints: {
          notify: 'notify.bugsnag.com',
          sessions: 'sessions.bugsnag.com',
          minidumps: 'notify.bugsnag.com'
        },
        maxBreadcrumbs: 16
      },
      _logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
      }
    }

    plugin.load(client as any)

    expect(nativeClient.install).toBeCalledTimes(1)
    expect(whenReadyCallback).toBeInstanceOf(Function)
    expect(client._logger.warn).not.toBeCalled()
  })

  it('should not install when autoDetectErrors disabled', () => {
    const client = {
      _config: {
        autoDetectErrors: false,
        enabledErrorTypes: {
          nativeCrashes: true
        },
        endpoints: {
          notify: 'notify.bugsnag.com',
          sessions: 'sessions.bugsnag.com',
          minidumps: 'notify.bugsnag.com'
        },
        maxBreadcrumbs: 16
      },
      _logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
      }
    }

    plugin.load(client as any)

    expect(nativeClient.install).not.toBeCalled()
    expect(whenReadyCallback).toBeUndefined()
    expect(client._logger.warn).not.toBeCalled()
  })

  it('should not install when nativeCrashes disabled', () => {
    const client = {
      _config: {
        autoDetectErrors: true,
        enabledErrorTypes: {
          nativeCrashes: false
        },
        endpoints: {
          notify: 'notify.bugsnag.com',
          sessions: 'sessions.bugsnag.com',
          minidumps: 'notify.bugsnag.com'
        },
        maxBreadcrumbs: 16
      },
      _logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
      }
    }

    plugin.load(client as any)

    expect(nativeClient.install).not.toBeCalled()
    expect(client._logger.warn).not.toBeCalled()
  })

  it('should not install when the minidumps endpoint is not configured', () => {
    const client = {
      _config: {
        autoDetectErrors: true,
        enabledErrorTypes: {
          nativeCrashes: true
        },
        endpoints: {
          notify: 'notify.bugsnag.com',
          sessions: 'sessions.bugsnag.com'
        },
        maxBreadcrumbs: 16
      },
      _logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
      }
    }

    plugin.load(client as any)

    expect(nativeClient.install).not.toBeCalled()
    expect(whenReadyCallback).toBeUndefined()
    expect(client._logger.warn).toHaveBeenCalledTimes(1)
    expect(client._logger.warn).toHaveBeenCalledWith(
      'Invalid configuration. endpoint.minidumps should be a valid URL, got undefined. Bugsnag will not send minidumps.'
    )
  })
})
