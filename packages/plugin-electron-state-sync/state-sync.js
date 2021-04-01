const EventEmitter = require('events')

module.exports = {
  name: 'stateSync',
  load: (client) => {
    const emitter = new EventEmitter()

    // proxy all state updates from within the main process
    // so that we can emit events for the changes

    const origSetUser = client.setUser
    client.setUser = (...args) => {
      const ret = origSetUser.call(client, ...args)
      emitter.emit('UserUpdate', client.getUser(), null)
      return ret
    }

    const origSetContext = client.setContext
    client.setContext = (...args) => {
      const ret = origSetContext.call(client, ...args)
      emitter.emit('ContextUpdate', client.getContext(), null)
      return ret
    }

    const origAddMetadata = client.addMetadata
    client.addMetadata = (...args) => {
      const ret = origAddMetadata.call(client, ...args)
      const [section] = args
      if (typeof section === 'string') {
        const values = client.getMetadata(section)
        emitter.emit('MetadataUpdate', { section, values }, null)
      }
      return ret
    }

    const origClearMetadata = client.clearMetadata
    client.clearMetadata = (...args) => {
      const ret = origClearMetadata.call(client, ...args)
      const [section] = args
      if (typeof section === 'string') {
        const values = client.getMetadata(section)
        emitter.emit('MetadataUpdate', { section, values }, null)
      }
      return ret
    }

    // handle a bulk update of initial values from a new renderer
    const bulkUpdate = ({ user, context, metadata }) => {
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
        emitter.emit('MetadataReplace', { metadata: client._metadata })
      }
    }

    return {
      events: ['UserUpdate', 'ContextUpdate', 'MetadataUpdate', 'MetadataReplace'],
      emitter,
      bulkUpdate
    }
  }
}
