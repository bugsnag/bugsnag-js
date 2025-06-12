const featureFlagDelegate = require('@bugsnag/core/lib/feature-flag-delegate')

const isEnabledFor = client => client._config.autoDetectErrors && client._config.enabledErrorTypes.nativeCrashes

module.exports = {
  NativeClient: require('bindings')('bugsnag_pecsp_bindings'),
  plugin: (NativeClient) => ({
    load: (client) => {
      if (!isEnabledFor(client)) {
        return
      }

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

      clientStateManager.emitter.on('FeatureFlagUpdate', features => {
        try {
          // convert the feature flags to the Event API format, so they are
          // ready to send immediately
          NativeClient.updateFeatureFlags(featureFlagDelegate.toEventApi(features))
        } catch (e) {
          client._logger.error(e)
        }
      })
    }
  })
}
