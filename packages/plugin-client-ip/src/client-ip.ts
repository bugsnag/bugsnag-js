import { Client, Plugin } from 'packages/core/types'
import assign from '@bugsnag/core/lib/es-utils/assign'

interface InternalClient extends Client {
  _config: {
    collectUserIp: boolean
  }
}

/*
 * Prevent collection of user IPs
 */
const plugin: Plugin = {
  load: client => {
    if ((client as InternalClient)._config.collectUserIp) return

    client.addOnError(event => {
      // If user.id is explicitly undefined, it will be missing from the payload. It needs
      // removing so that the following line replaces it
      if (event.getUser() && typeof event.getUser().id === 'undefined') {
        const _user = event.getUser()
        event.setUser('[REDACTED]', _user.email, _user.name)
      }
      event.request = assign({ clientIp: '[REDACTED]' }, event.request)
    })
  },
  // @ts-expect-error _config is private API
  configSchema: {
    collectUserIp: {
      defaultValue: () => true,
      message: 'should be true|false',
      validate: (value: boolean) => value === true || value === false
    }
  }
}

export default plugin
