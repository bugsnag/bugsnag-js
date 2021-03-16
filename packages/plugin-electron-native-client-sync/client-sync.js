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
        NativeClient.updateMetadata(section, values)
      } catch (e) {
        client._logger.error(e)
      }
    })

    // set initial state (if it was set in config)

    try {
      if (client._user && Object.keys(client._user).length) {
        const { id, email, name } = client.getUser()
        NativeClient.updateUser(id, email, name)
      }

      if (client._context) {
        NativeClient.updateContext(client.getContext())
      }

      if (client._metadata && Object.keys(client._metadata).length) {
        Object.keys(client._metadata).forEach((key) => {
          // TODO
        })
      }
    } catch (e) {
      client._logger.error(e)
    }
  }
})
