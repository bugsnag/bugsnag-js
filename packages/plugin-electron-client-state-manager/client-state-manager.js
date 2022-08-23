const EventEmitter = require('events')

module.exports = {
  name: 'clientStateManager',
  load: (client) => {
    const emitter = new EventEmitter()

    // proxy all state updates from within the main process
    // so that we can emit events for the changes

    const origSetUser = client.setUser
    client.setUser = (...args) => {
      const ret = origSetUser.call(client, ...args)
      emitter.emit('UserUpdate', client.getUser())
      return ret
    }

    const origSetContext = client.setContext
    client.setContext = (...args) => {
      const ret = origSetContext.call(client, ...args)
      emitter.emit('ContextUpdate', client.getContext())
      return ret
    }

    const origAddMetadata = client.addMetadata
    client.addMetadata = (...args) => {
      const ret = origAddMetadata.call(client, ...args)
      const [section] = args
      if (typeof section === 'string') {
        const values = client.getMetadata(section)
        emitter.emit('MetadataUpdate', { section, values })
      }
      return ret
    }

    const origClearMetadata = client.clearMetadata
    client.clearMetadata = (...args) => {
      const ret = origClearMetadata.call(client, ...args)
      const [section] = args
      if (typeof section === 'string') {
        const values = client.getMetadata(section)
        emitter.emit('MetadataUpdate', { section, values })
      }
      return ret
    }

    const origAddFeatureFlag = client.addFeatureFlag
    client.addFeatureFlag = (...args) => {
      const ret = origAddFeatureFlag.apply(client, args)
      emitter.emit('FeatureFlagUpdate', client._features.toJSON())
      return ret
    }

    const origAddFeatureFlags = client.addFeatureFlags
    client.addFeatureFlags = (...args) => {
      const ret = origAddFeatureFlags.apply(client, args)
      emitter.emit('FeatureFlagUpdate', client._features.toJSON())
      return ret
    }

    const origClearFeatureFlag = client.clearFeatureFlag
    client.clearFeatureFlag = (...args) => {
      const ret = origClearFeatureFlag.apply(client, args)
      emitter.emit('FeatureFlagUpdate', client._features.toJSON())
      return ret
    }

    const origClearFeatureFlags = client.clearFeatureFlags
    client.clearFeatureFlags = (...args) => {
      const ret = origClearFeatureFlags.apply(client, args)
      emitter.emit('FeatureFlagUpdate', client._features.toJSON())
      return ret
    }

    // handle a bulk update of initial values from a new renderer
    const bulkUpdate = ({ user, context, metadata, features }) => {
      if (user) {
        client.setUser(user.id, user.email, user.name)
      }
      if (context) {
        client.setContext(context)
      }
      if (metadata) {
        for (const section in metadata) {
          origAddMetadata.call(client, section, metadata[section])
        }
        emitter.emit('MetadataReplace', client._metadata)
      }

      if (features) {
        client.addFeatureFlags(features)
      }
    }

    return { emitter, bulkUpdate }
  }
}
