const { AppState } = require('react-native')

module.exports = {
  load: client => {
    if (!client._config.enabledBreadcrumbTypes || !client._config.enabledBreadcrumbTypes.includes('state')) return

    AppState.addEventListener('change', state => {
      client.leaveBreadcrumb('App state changed', { state }, 'state')
    })
  }
}
