/*
 * Prevent collection of user IPs
 */
module.exports = {
  init: (client) => {
    if (client._config.collectUserIp) return

    client._config.onError.push(event => {
      // If user.id is explicitly undefined, it will be missing from the payload. It needs
      // removing so that the following line replaces it
      if (event.user && typeof event.user.id === 'undefined') delete event.user.id
      event.user = { id: '[NOT COLLECTED]', ...event.user }
      event.request = { clientIp: '[NOT COLLECTED]', ...event.request }
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
