import createPlugin from '../deliver-minidumps'

jest.mock('electron', () => ({
  crashReporter: {
    start: () => {}
  }
}))

describe('electron-minidump-delivery: load', () => {
  const app = { on: jest.fn() }
  const net = {}

  const filestore = {
    getAppRunMetadata: () => ({ bugsnag_crash_id: 'abc123' }),
    getEventInfoPath: () => 'test-run-info-dir',
    getPaths: () => ({ lastRunInfo: 'last-run-info.json' })
  }

  const nativeClient = {
    install: jest.fn()
  }

  const plugin = createPlugin(app, net, filestore, nativeClient)

  it('should install when configured', () => {
    const client = {
      _config: {
        autoDetectErrors: true,
        enabledErrorTypes: {
          nativeCrashes: true
        },
        maxBreadcrumbs: 16
      }
    }

    plugin.load(client)

    expect(nativeClient.install).toBeCalledTimes(1)
  })

  it('should not install when autoDetectErrors disabled', () => {
    const client = {
      _config: {
        autoDetectErrors: false,
        enabledErrorTypes: {
          nativeCrashes: true
        },
        maxBreadcrumbs: 16
      }
    }

    plugin.load(client)

    expect(nativeClient.install).not.toBeCalled()
  })

  it('should not install when nativeCrashes disabled', () => {
    const client = {
      _config: {
        autoDetectErrors: true,
        enabledErrorTypes: {
          nativeCrashes: false
        },
        maxBreadcrumbs: 16
      }
    }

    plugin.load(client)

    expect(nativeClient.install).not.toBeCalled()
  })
})
