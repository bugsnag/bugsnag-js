const { AppState } = require('react-native')

module.exports = {
  init: client => {
    if (!client.config.enabledBreadcrumbTypes || !client.config.enabledBreadcrumbTypes.includes('state')) return

    AppState.addEventListener('change', state => {
      client.leaveBreadcrumb('App state changed', { state }, 'state')
    })
  }
}
