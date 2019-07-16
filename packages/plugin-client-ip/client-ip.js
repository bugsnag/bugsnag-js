/*
 * Prevent collection of user IPs
 */
module.exports = {
  init: (client) => {
    if (client.config.collectUserIp) return

    client.config.beforeSend.push(report => {
      report.set('user', 'id', report.get('user', 'id') || '[NOT COLLECTED]')
      report.set('request', 'clientIp', '[NOT COLLECTED]')
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
