const NetInfo = require('@react-native-community/netinfo')

module.exports = {
  init: client => {
    const explicitlyDisabled = client.config.connectivityBreadcrumbsEnabled === false
    const implicitlyDisabled = client.config.autoBreadcrumbs === false && client.config.connectivityBreadcrumbsEnabled !== true
    if (explicitlyDisabled || implicitlyDisabled) return

    NetInfo.addEventListener(({ isConnected, isInternetReachable, type }) => {
      client.leaveBreadcrumb(
        `Connectivity changed`, { isConnected, isInternetReachable, type }, 'state'
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
