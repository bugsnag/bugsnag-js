module.exports = () => {
  return {
    appType: 'complicated',
    appVersion: '2.0.83-beta3',
    context: 'shopping cart',
    user: {
      id: '3',
      email: 'elia@example.com',
      name: 'Elia'
    },
    onError: function (event) {
      event.addMetadata('account', { type: 'pro' })
      event.addMetadata('app', { part: 3 })
    },
    metadata: {
      site: {
        name: 'shop co'
      }
    },
    releaseStage: 'beta'
  }
}
