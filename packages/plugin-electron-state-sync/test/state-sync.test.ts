import stateSyncPlugin from '../state-sync'
import Client from '@bugsnag/core/client'

describe('@bugsnag/plugin-electron-state-sync', () => {
  it('should emit events when user changes', done => {
    const client = new Client({}, {}, [stateSyncPlugin], {})
    const { emitter } = client.getPlugin('stateSync')
    emitter.on('UserUpdate', (payload, source) => {
      expect(payload.user).toEqual({ id: '123', email: 'jim@jim.com', name: 'Jim' })
      expect(source).toBe(null)
      done()
    })
    client.setUser('123', 'jim@jim.com', 'Jim')
  })

  it('should emit events when context changes', done => {
    const client = new Client({}, {}, [stateSyncPlugin], {})
    const { emitter } = client.getPlugin('stateSync')
    emitter.on('ContextUpdate', (payload, source) => {
      expect(payload.context).toBe('ctx')
      expect(source).toBe(null)
      done()
    })
    client.setContext('ctx')
  })

  it('should emit events when metadata is added', done => {
    const client = new Client({}, {}, [stateSyncPlugin], {})
    const { emitter } = client.getPlugin('stateSync')
    emitter.on('MetadataUpdate', (payload, source) => {
      expect(payload.section).toBe('section')
      expect(payload.values).toEqual({ key: 'value' })
      expect(source).toBe(null)
      done()
    })
    client.addMetadata('section', 'key', 'value')
  })

  it('should emit events when metadata is cleared', done => {
    const client = new Client({}, {}, [stateSyncPlugin], {})
    const { emitter } = client.getPlugin('stateSync')
    emitter.on('MetadataUpdate', (payload, source) => {
      expect(payload.section).toBe('section')
      expect(payload.values).toBe(undefined)
      expect(source).toBe(null)
      done()
    })
    client.clearMetadata('section', 'key')
  })

  describe('triggering changes with a particular source', () => {
    it('should allow setting user, providing a custom source', done => {
      const client = new Client({}, {}, [stateSyncPlugin], {})
      const { emitter, updateUserFromSource } = client.getPlugin('stateSync')
      const mockSource = {}
      emitter.on('UserUpdate', (payload, source) => {
        expect(payload.user).toEqual({ id: '123', email: 'jim@jim.com', name: 'Jim' })
        expect(source).toBe(mockSource)
        done()
      })
      updateUserFromSource(mockSource)({ user: { id: '123', email: 'jim@jim.com', name: 'Jim' } })
    })

    it('should allow setting context, providing a custom source', done => {
      const client = new Client({}, {}, [stateSyncPlugin], {})
      const { emitter, updateContextFromSource } = client.getPlugin('stateSync')
      const mockSource = {}
      emitter.on('ContextUpdate', (payload, source) => {
        expect(payload.context).toEqual('ctx')
        expect(source).toBe(mockSource)
        done()
      })
      updateContextFromSource(mockSource)({ context: 'ctx' })
    })
  })
})
