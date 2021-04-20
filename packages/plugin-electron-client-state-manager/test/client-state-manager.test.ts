import stateManager from '../client-state-manager'
import Client from '@bugsnag/core/client'
import { User } from '@bugsnag/core'

const Notifier = {
  name: 'Bugsnag Electron Test',
  version: '0.0.0',
  url: 'https://github.com/bugsnag/bugsnag-js'
}

describe('@bugsnag/plugin-electron-client-state-manager', () => {
  it('should emit events when user changes', done => {
    const client = new Client({ apiKey: '123' }, {}, [stateManager], Notifier)
    const { emitter } = client.getPlugin('clientStateManager')
    emitter.on('UserUpdate', (user: User) => {
      expect(user).toEqual({ id: '123', email: 'jim@jim.com', name: 'Jim' })
      done()
    })
    client.setUser('123', 'jim@jim.com', 'Jim')
  })

  it('should emit events when context changes', done => {
    const client = new Client({ apiKey: '123' }, {}, [stateManager], Notifier)
    const { emitter } = client.getPlugin('clientStateManager')
    emitter.on('ContextUpdate', (context: string) => {
      expect(context).toBe('ctx')
      done()
    })
    client.setContext('ctx')
  })

  interface MetadataUpdatePayload {
    section: string
    values?: Record<string, unknown>
  }

  it('should emit events when metadata is added', done => {
    const client = new Client({ apiKey: '123' }, {}, [stateManager], Notifier)
    const { emitter } = client.getPlugin('clientStateManager')
    emitter.on('MetadataUpdate', (payload: MetadataUpdatePayload) => {
      expect(payload.section).toBe('section')
      expect(payload.values).toEqual({ key: 'value' })
      done()
    })
    client.addMetadata('section', 'key', 'value')
  })

  it('should emit events when metadata is cleared', done => {
    const client = new Client({ apiKey: '123' }, {}, [stateManager], Notifier)
    const { emitter } = client.getPlugin('clientStateManager')
    emitter.on('MetadataUpdate', (payload: MetadataUpdatePayload) => {
      expect(payload.section).toBe('section')
      expect(payload.values).toBe(undefined)
      done()
    })
    client.clearMetadata('section', 'key')
  })

  it('should support bulk updates (all values)', () => {
    const client = new Client({ apiKey: '123' }, {}, [stateManager], Notifier)
    const { emitter, bulkUpdate } = client.getPlugin('clientStateManager')

    const metadataCb = jest.fn()
    const contextCb = jest.fn()
    const userCb = jest.fn()

    emitter.on('MetadataReplace', metadataCb)
    emitter.on('ContextUpdate', contextCb)
    emitter.on('UserUpdate', userCb)

    // update everything
    bulkUpdate({
      user: {
        id: '123', name: 'Jim', email: 'jim@jim.com'
      },
      context: 'ctx',
      metadata: {
        section: { key: 'value' }
      }
    })

    expect(metadataCb).toHaveBeenCalledWith({ section: { key: 'value' } })
    expect(contextCb).toHaveBeenCalledWith('ctx')
    expect(userCb).toHaveBeenCalledWith({ id: '123', name: 'Jim', email: 'jim@jim.com' })
  })

  it('should support bulk updates (only context)', () => {
    const client = new Client({ apiKey: '123' }, {}, [stateManager], Notifier)
    const { emitter, bulkUpdate } = client.getPlugin('clientStateManager')

    const metadataCb = jest.fn()
    const contextCb = jest.fn()
    const userCb = jest.fn()

    emitter.on('MetadataReplace', metadataCb)
    emitter.on('ContextUpdate', contextCb)
    emitter.on('UserUpdate', userCb)

    // update just context
    bulkUpdate({
      context: 'ctx'
    })

    expect(metadataCb).not.toHaveBeenCalled()
    expect(contextCb).toHaveBeenCalledWith('ctx')
    expect(userCb).not.toHaveBeenCalled()
  })

  it('should support bulk updates (only user)', () => {
    const client = new Client({ apiKey: '123' }, {}, [stateManager], Notifier)
    const { emitter, bulkUpdate } = client.getPlugin('clientStateManager')

    const metadataCb = jest.fn()
    const contextCb = jest.fn()
    const userCb = jest.fn()

    emitter.on('MetadataReplace', metadataCb)
    emitter.on('ContextUpdate', contextCb)
    emitter.on('UserUpdate', userCb)

    // update just user
    bulkUpdate({
      user: { id: '123', name: 'Jim', email: 'jim@jim.com' }
    })

    expect(metadataCb).not.toHaveBeenCalled()
    expect(contextCb).not.toHaveBeenCalledWith()
    expect(userCb).toHaveBeenCalledWith({ id: '123', name: 'Jim', email: 'jim@jim.com' })
  })

  it('should support bulk updates (only metadata)', () => {
    const client = new Client({ apiKey: '123' }, {}, [stateManager], Notifier)
    const { emitter, bulkUpdate } = client.getPlugin('clientStateManager')

    const metadataCb = jest.fn()
    const contextCb = jest.fn()
    const userCb = jest.fn()

    emitter.on('MetadataReplace', metadataCb)
    emitter.on('ContextUpdate', contextCb)
    emitter.on('UserUpdate', userCb)

    // update just metadata
    bulkUpdate({
      metadata: {
        section: { key: 'value' }
      }
    })

    expect(metadataCb).toHaveBeenCalledWith({ section: { key: 'value' } })
    expect(contextCb).not.toHaveBeenCalled()
    expect(userCb).not.toHaveBeenCalled()
  })
})
