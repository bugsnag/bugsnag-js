import type { Config, Device, Plugin } from '@bugsnag/core'
import assign from '@bugsnag/core/lib/es-utils/assign'
import setDefaultUserId from './set-default-user-id'
import getDeviceId from './get-device-id'

// Declare deprecated navigator values
declare global {
  interface Navigator {
    browserLanguage?: string
    systemLanguage?: string
    userLanguage?: string
  }
}

interface PluginConfig extends Config {
  generateAnonymousId?: boolean
  collectUserIp?: boolean
}

/*
 * Automatically detects browser device details
 */
export default (nav = navigator, win: Window | null = window): Plugin<PluginConfig> => ({
  name: 'device',
  load: (client) => {
    const device: Device = {
      locale: nav.browserLanguage || nav.systemLanguage || nav.userLanguage || nav.language,
      userAgent: nav.userAgent
    }

    if (win && win.screen && win.screen.orientation && win.screen.orientation.type) {
      device.orientation = win.screen.orientation.type
    } else if (win && win.document) {
      device.orientation =
        win.document.documentElement.clientWidth > win.document.documentElement.clientHeight
          ? 'landscape'
          : 'portrait'
    }

    if (client._config.generateAnonymousId && win) {
      device.id = getDeviceId(win)
    }

    client.addOnSession(session => {
      session.device = assign({}, session.device, device)
      // only set device id if collectUserIp is false
      if (!client._config.collectUserIp) setDefaultUserId(session)
    })

    // add time just as the event is sent
    client.addOnError((event) => {
      event.device = assign({},
        event.device,
        device,
        { time: new Date() }
      )
      if (!client._config.collectUserIp) setDefaultUserId(event)
    }, true)
  },
  configSchema: {
    generateAnonymousId: {
      validate: (value: unknown): value is boolean => value === true || value === false,
      defaultValue: () => true,
      message: 'should be true|false'
    }
  }
})
