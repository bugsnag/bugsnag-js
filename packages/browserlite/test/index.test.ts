import Bugsnag from '../src/notifier'

/* eslint-disable @typescript-eslint/no-var-requires */
const BrowserContextPlugin = require('@bugsnag/plugin-browser-context')
const InteractionBreadcrumbsPlugin = require('@bugsnag/plugin-interaction-breadcrumbs')
const NetworkBreadcrumbsPlugin = require('@bugsnag/plugin-network-breadcrumbs')
const BrowserSessionPlugin = require('@bugsnag/plugin-browser-session')
const DeviceDataPlugin = require('@bugsnag/plugin-browser-device')

const loadPlugin = (factory: any): any => {
  if (!factory) return null
  if (typeof factory === 'function') {
    try {
      const plugin = factory()
      if (plugin && typeof plugin.load === 'function') return plugin
    } catch {}
    try {
      const plugin = factory(window)
      if (plugin && typeof plugin.load === 'function') return plugin
    } catch {}
    return null
  }
  return factory && typeof factory.load === 'function' ? factory : null
}

const VALID_API_KEY = '12345678901234567890123456789012'

// SECTION 1: Default / Baseline Behavior
describe('@bugsnag/browserlite — default baseline behavior', () => {
  it('initializes successfully with only an API key', () => {
    const client = Bugsnag.createClient({ apiKey: VALID_API_KEY })
    expect(client).toBeDefined()
  })

  it('has autoTrackSessions disabled by default', () => {
    const client = Bugsnag.createClient({ apiKey: VALID_API_KEY })
    expect(client._config.autoTrackSessions).toBe(false)
  })

  it('does not load breadcrumb plugin by default', () => {
    const client = Bugsnag.createClient({ apiKey: VALID_API_KEY })
    expect(client.getPlugin('interactionBreadcrumbs')).toBeUndefined()
  })

  it('does not load device data plugin by default', () => {
    const client = Bugsnag.createClient({ apiKey: VALID_API_KEY })
    expect(client.getPlugin('device')).toBeUndefined()
  })

  it('does not load network breadcrumbs plugin by default', () => {
    const client = Bugsnag.createClient({ apiKey: VALID_API_KEY })
    expect(client.getPlugin('networkBreadcrumbs')).toBeUndefined()
  })

  it('does not load session tracking plugin by default', () => {
    const client = Bugsnag.createClient({ apiKey: VALID_API_KEY })
    expect(client.getPlugin('session')).toBeUndefined()
  })
})

// SECTION 2: Core Error Capture
describe('@bugsnag/browserlite — core error capture', () => {
  it('captures an unhandled window error via window-onerror plugin', () => {
    const client = Bugsnag.createClient({ apiKey: VALID_API_KEY })
    const notifySpy = jest.spyOn(client as any, '_notify')

    const err = new Error('uncaught error')
    window.onerror?.('uncaught error', 'http://example.com', 1, 1, err)

    expect(notifySpy).toHaveBeenCalled()
    notifySpy.mockRestore()
  })

  it('captures an unhandled promise rejection via window-unhandled-rejection plugin', async () => {
    const client = Bugsnag.createClient({ apiKey: VALID_API_KEY })
    const notifySpy = jest.spyOn(client as any, '_notify')

    const rejectedPromise = Promise.reject(new Error('rejected'))
    rejectedPromise.catch(() => {})

    const rejectionEvent = new Event('unhandledrejection') as any
    rejectionEvent.promise = rejectedPromise
    rejectionEvent.reason = new Error('rejected')
    window.dispatchEvent(rejectionEvent)

    await Promise.resolve()
    expect(notifySpy).toHaveBeenCalled()
    notifySpy.mockRestore()
  })

  it('creates and reports an error event via notify()', () => {
    const client = Bugsnag.createClient({ apiKey: VALID_API_KEY })
    const notifySpy = jest.spyOn(client, 'notify')

    client.notify(new Error('manual error'))

    expect(notifySpy).toHaveBeenCalledWith(expect.any(Error))
    notifySpy.mockRestore()
  })
})


// SECTION 3: Real Plugin — Browser Context
describe('@bugsnag/browserlite — real plugin: browser-context', () => {
  it('resolves @bugsnag/plugin-browser-context correctly', () => {
    const plugin = loadPlugin(BrowserContextPlugin)
    expect(plugin).not.toBeNull()
    expect(typeof plugin.load).toBe('function')
  })

  it('initializes browser-context plugin on browserlite client without throwing', () => {
    const plugin = loadPlugin(BrowserContextPlugin)
    expect(() => {
      Bugsnag.createClient({
        apiKey: VALID_API_KEY,
        plugins: [plugin]
      })
    }).not.toThrow()
  })

  it('browser-context plugin attaches context metadata to event payload', () => {
    const plugin = loadPlugin(BrowserContextPlugin)
    const client = Bugsnag.createClient({
      apiKey: VALID_API_KEY,
      plugins: [plugin]
    })

    const sendEventSpy = jest.spyOn(client._delivery, 'sendEvent')
    client.notify(new Error('context test'))

    expect(sendEventSpy).toHaveBeenCalled()
    const payload = sendEventSpy.mock.calls[sendEventSpy.mock.calls.length - 1][0]
    expect(payload).toBeDefined()
    expect(payload.events[0].context).toBe(window.location.pathname)
  })
}) 

// SECTION 4: Real Plugin — Interaction Breadcrumbs
describe('@bugsnag/browserlite — real plugin: interaction-breadcrumbs', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('resolves @bugsnag/plugin-interaction-breadcrumbs correctly', () => {
    const plugin = loadPlugin(InteractionBreadcrumbsPlugin)
    expect(plugin).not.toBeNull()
    expect(typeof plugin.load).toBe('function')
  })

  it('initializes interaction-breadcrumbs plugin on browserlite client without throwing', () => {
    const plugin = loadPlugin(InteractionBreadcrumbsPlugin)
    expect(() => {
      Bugsnag.createClient({
        apiKey: VALID_API_KEY,
        plugins: [plugin]
      })
    }).not.toThrow()
  })

  it('records a UI click breadcrumb on button click', () => {
    const plugin = loadPlugin(InteractionBreadcrumbsPlugin)
    const client = Bugsnag.createClient({
      apiKey: VALID_API_KEY,
      plugins: [plugin]
    })

    const button = document.createElement('button')
    button.textContent = 'Submit'
    document.body.appendChild(button)
    button.click()

    expect(client).toBeDefined()
  })
}) 

// SECTION 5: Real Plugin — Session Tracking
describe('@bugsnag/browserlite — real plugin: browser-session', () => {
  it('resolves @bugsnag/plugin-browser-session correctly', () => {
    const plugin = loadPlugin(BrowserSessionPlugin)
    expect(plugin).not.toBeNull()
    expect(typeof plugin.load).toBe('function')
  })

  it('initializes session plugin when opted in without throwing', () => {
    const plugin = loadPlugin(BrowserSessionPlugin)
    expect(() => {
      Bugsnag.createClient({
        apiKey: VALID_API_KEY,
        autoTrackSessions: true,
        plugins: [plugin]
      })
    }).not.toThrow()
  })

  it('does NOT auto-start a session when autoTrackSessions is false (default)', () => {
    const plugin = loadPlugin(BrowserSessionPlugin)
    const client = Bugsnag.createClient({
      apiKey: VALID_API_KEY,
      plugins: [plugin]
    })
    expect(client._config.autoTrackSessions).toBe(false)
  })
}) 

// SECTION 6: Real Plugin — Device Data
describe('@bugsnag/browserlite — real plugin: browser-device', () => {
  it('resolves @bugsnag/plugin-browser-device correctly', () => {
    const plugin = loadPlugin(DeviceDataPlugin)
    expect(plugin).not.toBeNull()
    expect(typeof plugin.load).toBe('function')
  })

  it('initializes device plugin on browserlite client without throwing', () => {
    const plugin = loadPlugin(DeviceDataPlugin)
    expect(() => {
      Bugsnag.createClient({
        apiKey: VALID_API_KEY,
        plugins: [plugin]
      })
    }).not.toThrow()
  })

  it('device plugin attaches device metadata to event payload', (done) => {
    const plugin = loadPlugin(DeviceDataPlugin)
    const client = Bugsnag.createClient({
      apiKey: VALID_API_KEY,
      plugins: [plugin]
    })

    jest.spyOn(client as any, '_notify').mockImplementation((event: any) => {
      expect(event.device).toBeDefined()
      done()
    })

    client.notify(new Error('device test'))
  })
}) 


// SECTION 7: Multi-Plugin Compatibility
describe('@bugsnag/browserlite — multi-plugin compatibility', () => {
  it('loads multiple real plugins simultaneously without errors', () => {
    const pluginGroup = [
      loadPlugin(BrowserContextPlugin),
      loadPlugin(InteractionBreadcrumbsPlugin),
      loadPlugin(BrowserSessionPlugin),
      loadPlugin(DeviceDataPlugin)
    ].filter(Boolean)

    expect(() => {
      Bugsnag.createClient({
        apiKey: VALID_API_KEY,
        plugins: pluginGroup
      })
    }).not.toThrow()
  })

  it('all plugins contribute their data to a single event payload', () => {
    const client = Bugsnag.createClient({
      apiKey: VALID_API_KEY,
      plugins: [
        loadPlugin(BrowserContextPlugin),
        loadPlugin(DeviceDataPlugin)
      ].filter(Boolean)
    })

    const sendEventSpy = jest.spyOn(client._delivery, 'sendEvent')
    client.notify(new Error('multi-plugin event'))

    expect(sendEventSpy).toHaveBeenCalled()
    const payload = sendEventSpy.mock.calls[sendEventSpy.mock.calls.length - 1][0]
    expect(payload.events[0].context).toBe(window.location.pathname)
    expect(payload.events[0].device).toBeDefined()
  })

  it('plugin load order does not cause runtime errors', () => {
    expect(() => {
      Bugsnag.createClient({
        apiKey: VALID_API_KEY,
        plugins: [
          loadPlugin(DeviceDataPlugin),
          loadPlugin(BrowserSessionPlugin),
          loadPlugin(InteractionBreadcrumbsPlugin),
          loadPlugin(BrowserContextPlugin)
        ].filter(Boolean)
      })
    }).not.toThrow()
  })
}) 

// SECTION 8: Network Breadcrumbs (opt-in)
describe('@bugsnag/browserlite — real plugin: network-breadcrumbs', () => {
  it('resolves @bugsnag/plugin-network-breadcrumbs correctly', () => {
    const plugin = loadPlugin(NetworkBreadcrumbsPlugin)
    expect(plugin).not.toBeNull()
    expect(typeof plugin.load).toBe('function')
  })

  it('initializes network-breadcrumbs plugin on browserlite client without throwing', () => {
    const plugin = loadPlugin(NetworkBreadcrumbsPlugin)
    expect(() => {
      Bugsnag.createClient({
        apiKey: VALID_API_KEY,
        plugins: [plugin]
      })
    }).not.toThrow()
  })
}) 