const assign = require('@bugsnag/core/lib/es-utils/assign')

/*
 * Prevent collection of user IPs
 */
module.exports = {
  load: (client) => {
    if (client._config.collectUserIp) return

    client.addOnError(event => {
      // If user.id is explicitly undefined, it will be missing from the payload. It needs
      // removing so that the following line replaces it
      if (event._user && typeof event._user.id === 'undefined') delete event._user.id
      event._user = assign({ id: '[REDACTED]' }, event._user)
      event.request = assign({ clientIp: '[REDACTED]' }, event.request)
    })
  },
  configSchema: {
    collectUserIp: {
      defaultValue: () => true,
      message: 'should be true|false',
      validate: value => value === true || value === false
    }
  }
}
