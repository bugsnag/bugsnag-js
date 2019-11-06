/*
 * Prevent collection of user IPs
 */
module.exports = {
  init: (client) => {
    if (client._config.collectUserIp) return

    client.addOnError(event => {
      // If user.id is explicitly undefined, it will be missing from the payload. It needs
      // removing so that the following line replaces it
      if (event._user && typeof event._user.id === 'undefined') delete event._user.id
      event._user = { id: '[REDACTED]', ...event._user }
      event.request = { clientIp: '[REDACTED]', ...event.request }
    }, true)
  },
  configSchema: {
    collectUserIp: {
      defaultValue: () => true,
      message: 'should be true|false',
      validate: value => value === true || value === false
    }
  }
}
