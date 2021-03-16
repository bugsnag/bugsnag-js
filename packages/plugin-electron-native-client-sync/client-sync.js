module.exports = (NativeClient) => ({
  load: (client) => {
    client.addOnBreadcrumb(breadcrumb => {
      try {
        NativeClient.leaveBreadcrumb(breadcrumb)
      } catch (e) {
        client._logger.error(e)
      }
    }, true)

    const stateSync = client.getPlugin('stateSync')

    stateSync.emitter.on('UserUpdate', ({ user }) => {
      try {
        NativeClient.updateUser(user.id, user.email, user.name)
      } catch (e) {
        client._logger.error(e)
      }
    })

    stateSync.emitter.on('ContextUpdate', ({ context }) => {
      try {
        NativeClient.updateContext(context)
      } catch (e) {
        client._logger.error(e)
      }
    })

    stateSync.emitter.on('MetadataUpdate', ({ section, values }) => {
      try {
        // TODO
      } catch (e) {
        client._logger.error(e)
      }
    })
  }
})
