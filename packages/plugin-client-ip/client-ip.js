/*
 * Prevent collection of user IPs
 */
module.exports = {
  init: (client) => {
    if (client.config.collectUserIp) return

    client.config.beforeSend.push(report => {
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
