/*
 * Prevent collection of user IPs
 */
module.exports = {
  init: (client) => {
    if (client.config.collectUserIp) return

    client.config.beforeSend.push(report => {
      // If user.id is explicitly undefined, it will be missing from the payload. It needs
      // removing so that the following line replaces it
      if (report.user && typeof report.user.id === 'undefined') delete report.user.id
      report.user = { id: '[NOT COLLECTED]', ...report.user }
      report.request = { clientIp: '[NOT COLLECTED]', ...report.request }
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
