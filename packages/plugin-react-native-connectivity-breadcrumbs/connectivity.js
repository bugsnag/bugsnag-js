const { NetInfo } = require('react-native')

module.exports = {
  init: client => {
    if (!client._config.enabledBreadcrumbTypes || !client._config.enabledBreadcrumbTypes.includes('state')) return
    NetInfo.addEventListener('connectionChange', ({ type, effectiveType }) => {
      client.leaveBreadcrumb(
        'Connectivity changed',
        {
          type,
          effectiveType
        },
        'state'
      )
    })
  }
}
