import stateSyncPlugin from '../state-sync'
import Client from '@bugsnag/core/client'

describe('@bugsnag/plugin-electron-state-sync', () => {
  it('should emit events when user changes', done => {
    const client = new Client({}, {}, [stateSyncPlugin], {})
    const { emitter } = client.getPlugin('stateSync')
    emitter.on('UserUpdate', user => {
      expect(user).toEqual({ id: '123', email: 'jim@jim.com', name: 'Jim' })
      done()
    })
    client.setUser('123', 'jim@jim.com', 'Jim')
  })

  it('should emit events when context changes', done => {
    const client = new Client({}, {}, [stateSyncPlugin], {})
    const { emitter } = client.getPlugin('stateSync')
    emitter.on('ContextUpdate', (context) => {
      expect(context).toBe('ctx')
      done()
    })
    client.setContext('ctx')
  })

  it('should emit events when metadata is added', done => {
    const client = new Client({}, {}, [stateSyncPlugin], {})
    const { emitter } = client.getPlugin('stateSync')
    emitter.on('MetadataUpdate', (payload) => {
      expect(payload.section).toBe('section')
      expect(payload.values).toEqual({ key: 'value' })
      done()
    })
    client.addMetadata('section', 'key', 'value')
  })

  it('should emit events when metadata is cleared', done => {
    const client = new Client({}, {}, [stateSyncPlugin], {})
    const { emitter } = client.getPlugin('stateSync')
    emitter.on('MetadataUpdate', (payload) => {
      expect(payload.section).toBe('section')
      expect(payload.values).toBe(undefined)
      done()
    })
    client.clearMetadata('section', 'key')
  })
})
