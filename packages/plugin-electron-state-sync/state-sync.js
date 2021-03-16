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
      emitter.emit('UserUpdate', { user: client.getUser() }, null)
      return ret
    }

    const origSetContext = client.setContext
    client.setContext = (...args) => {
      const ret = origSetContext.call(client, ...args)
      emitter.emit('ContextUpdate', { context: client.getContext() }, null)
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

    // apply inbound updates from another process, emitting an event
    // containing the source so that we can notify _other_ processes

    const updateUserFromSource = source => ({ user }) => {
      client._user = user
      emitter.emit('UserUpdate', { user }, source)
    }

    const updateContextFromSource = source => ({ context }) => {
      client._context = context
      emitter.emit('ContextUpdate', { context }, source)
    }

    const updateMetadataFromSource = source => ({ section, values }) => {
      client._metadata[section] = values
      emitter.emit('MetadataUpdate', { section, values }, source)
    }

    return {
      events: ['UserUpdate', 'ContextUpdate', 'MetadataUpdate'],
      emitter,
      updateUserFromSource,
      updateContextFromSource,
      updateMetadataFromSource
    }
  }
}
