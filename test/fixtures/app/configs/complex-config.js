module.exports = () => {
  return {
    appVersion: '2.0.83-beta3',
    context: 'shopping cart',
    onError: function (event) {
      event.setUser('3', 'elia@example.com', 'Elia')
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
