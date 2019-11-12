const { NetInfo } = require('react-native')

module.exports = {
  init: client => {
    const explicitlyDisabled = client.config.connectivityBreadcrumbsEnabled === false
    const implicitlyDisabled = client.config.autoBreadcrumbs === false && client.config.connectivityBreadcrumbsEnabled !== true
    if (explicitlyDisabled || implicitlyDisabled) return

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
  },
  configSchema: {
    connectivityBreadcrumbsEnabled: {
      defaultValue: () => undefined,
      validate: (value) => value === true || value === false || value === undefined,
      message: 'should be true|false'
    }
  }
}
