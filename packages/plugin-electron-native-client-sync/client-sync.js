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

    stateSync.emitter.on('AddMetadata', ({ section, keyOrValues, value }) => {
      try {
        if (typeof keyOrValues === 'object') {
          NativeClient.addMetadata(section, keyOrValues)
        } else {
          NativeClient.addMetadata(section, { [keyOrValues]: value })
        }
      } catch (e) {
        client._logger.error(e)
      }
    })

    stateSync.emitter.on('ClearMetadata', ({ section, key }) => {
      try {
        NativeClient.clearMetadata(section, key)
      } catch (e) {
        client._logger.error(e)
      }
    })
  }
})
