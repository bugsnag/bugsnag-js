const { AppState } = require('react-native')

module.exports = {
  init: client => {
    const explicitlyDisabled = client.config.appStateBreadcrumbsEnabled === false
    const implicitlyDisabled = client.config.autoBreadcrumbs === false && client.config.appStateBreadcrumbsEnabled !== true
    if (explicitlyDisabled || implicitlyDisabled) return

    AppState.addEventListener('change', state => {
      client.leaveBreadcrumb('App state changed', { state }, 'state')
    })
  },
  configSchema: {
    appStateBreadcrumbsEnabled: {
      defaultValue: () => undefined,
      validate: (value) => value === true || value === false || value === undefined,
      message: 'should be true|false'
    }
  }
}
