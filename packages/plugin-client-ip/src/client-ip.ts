import type { Plugin } from '@bugsnag/core'

interface Config {
  collectUserIp: boolean
}

/*
 * Prevent collection of user IPs
 */
const plugin: Plugin = {
  load: client => {
    if ((client._config as unknown as Config).collectUserIp) return

    client.addOnError(event => {
      // If user.id is explicitly undefined, it will be missing from the payload. It needs
      // removing so that the following line replaces it
      if (event.getUser() && typeof event.getUser().id === 'undefined') {
        const _user = event.getUser()
        event.setUser('[REDACTED]', _user.email, _user.name)
      }
      event.request = Object.assign({ clientIp: '[REDACTED]' }, event.request)
    })
  },
  configSchema: {
    collectUserIp: {
      defaultValue: () => true,
      message: 'should be true|false',
      validate: (value: unknown) => value === true || value === false
    }
  }
}

export default plugin
