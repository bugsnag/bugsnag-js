module.exports = {
  NativeClient: require('bindings')('bugsnag_pecsp_bindings'),
  plugin: (NativeClient) => ({
    load: (client) => {
      client.addOnBreadcrumb(breadcrumb => {
        try {
          NativeClient.leaveBreadcrumb(breadcrumb)
        } catch (e) {
          client._logger.error(e)
        }
      }, true)

      const clientStateManager = client.getPlugin('clientStateManager')

      clientStateManager.emitter.on('UserUpdate', user => {
        try {
          NativeClient.updateUser(user.id, user.email, user.name)
        } catch (e) {
          client._logger.error(e)
        }
      })

      clientStateManager.emitter.on('ContextUpdate', context => {
        try {
          NativeClient.updateContext(context)
        } catch (e) {
          client._logger.error(e)
        }
      })

      clientStateManager.emitter.on('MetadataUpdate', ({ section, values }) => {
        try {
          NativeClient.updateMetadata(section, values)
        } catch (e) {
          client._logger.error(e)
        }
      })

      clientStateManager.emitter.on('MetadataReplace', (metadata) => {
        try {
          NativeClient.updateMetadata(metadata)
        } catch (e) {
          client._logger.error(e)
        }
      })
    }
  })
}
