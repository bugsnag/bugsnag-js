const NetInfo = require('@react-native-community/netinfo')

module.exports = {
  load: client => {
    if (!client._config.enabledBreadcrumbTypes || !client._config.enabledBreadcrumbTypes.includes('state')) return

    NetInfo.addEventListener(({ isConnected, isInternetReachable, type }) => {
      client.leaveBreadcrumb(
        'Connectivity changed', { isConnected, isInternetReachable, type }, 'state'
      )
    })
  }
}
