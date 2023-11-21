import { plugin } from '../'
import { Breadcrumb } from '@bugsnag/core'
import stateManager from '@bugsnag/plugin-electron-client-state-manager'
import { makeClientForPlugin } from '@bugsnag/electron-test-helpers'

const schema = {
  enabledErrorTypes: {
    defaultValue: () => ({
      unhandledExceptions: true,
      unhandledRejections: true,
      nativeCrashes: true
    }),
    allowPartialObject: true,
    validate: value => true
  }
}

function makeClient (NativeClient: object, config?: object) {
  return makeClientForPlugin({ plugins: [stateManager, plugin(NativeClient)], schema, config })
}

describe('plugin: electron client sync', () => {
  it('updates context', done => {
    const { client } = makeClient({
      updateContext: (update: any) => {
        expect(update).toBe('1234')
        done()
      }
    })
    client.setContext('1234')
  })

  it('updates metadata', done => {
    const { client } = makeClient({
      updateMetadata: (key: string, updates: any) => {
        expect(key).toBe('widget')
        expect(updates).toEqual({
          id: '14',
          count: 340
        })
        done()
      }
    })
    client.addMetadata('widget', { id: '14', count: 340 })
    expect(client.getMetadata('widget')).toEqual({ id: '14', count: 340 })
  })

  it('clears metadata', done => {
    const { client } = makeClient({
      addMetadata: () => {},
      clearMetadata: () => {}
    })
    client.addMetadata('widget', { id: '14', count: 340 })
    expect(client.getMetadata('widget')).toEqual({ id: '14', count: 340 })
    client.clearMetadata('widget', 'count')
    expect(client.getMetadata('widget', 'count')).toBeUndefined()
    client.clearMetadata('widget')
    expect(client.getMetadata('widget')).toBeUndefined()
    done()
  })

  it('updates user', done => {
    const { client } = makeClient({
      updateUser: (id: string, email: string, name: string) => {
        expect(id).toBe('1234')
        expect(name).toBe('Ben')
        expect(email).toBe('user@example.com')
        done()
      }
    })
    client.setUser('1234', 'user@example.com', 'Ben')
    expect(client.getUser()).toEqual({ id: '1234', name: 'Ben', email: 'user@example.com' })
  })

  it('syncs breadcrumbs', (done) => {
    const { client } = makeClient({
      leaveBreadcrumb: ({ message, metadata, type, timestamp }: Breadcrumb) => {
        expect(message).toBe('Spin')
        expect(type).toBe('manual')
        expect(metadata).toEqual({ direction: 'ccw', deg: '90' })
        expect(timestamp).toBeTruthy()
        done()
      }
    })
    client.leaveBreadcrumb('Spin', { direction: 'ccw', deg: '90' })
  })

  it('does not sync breadcrumbs that are cancelled by an onBreadcrumb callback', () => {
    const NativeClient = { leaveBreadcrumb: jest.fn() }

    const { client } = makeClient(NativeClient)

    client.addOnBreadcrumb(breadcrumb => {
      if (breadcrumb.message === 'skip me') {
        return false
      }
    })

    // this onBreadcrumb is added last so it should always be called as it runs first
    const alwaysCalledOnBreadcrumb = jest.fn()
    client.addOnBreadcrumb(alwaysCalledOnBreadcrumb)

    client.leaveBreadcrumb('skip me')

    expect(alwaysCalledOnBreadcrumb).toHaveBeenCalled()
    expect(NativeClient.leaveBreadcrumb).not.toHaveBeenCalled()

    client.leaveBreadcrumb('this should be synced!')

    expect(alwaysCalledOnBreadcrumb).toHaveBeenCalled()
    expect(NativeClient.leaveBreadcrumb).toHaveBeenCalledWith(expect.objectContaining({
      message: 'this should be synced!',
      metadata: {},
      type: 'manual'
    }))
  })

  it('updates feature flags', () => {
    const updateFeatureFlags = jest.fn()

    const { client } = makeClient({ updateFeatureFlags })

    client.addFeatureFlag('a', 'b')
    client.addFeatureFlags([{ name: 'c', variant: null }, { name: 'd', variant: 'e' }])

    expect(client._features).toStrictEqual([{ name: 'a', variant: 'b' }, { name: 'c', variant: null }, { name: 'd', variant: 'e' }])

    expect(updateFeatureFlags).toHaveBeenCalledTimes(2)
    expect(updateFeatureFlags).toHaveBeenNthCalledWith(1, [{ featureFlag: 'a', variant: 'b' }])
    expect(updateFeatureFlags).toHaveBeenNthCalledWith(2, [
      { featureFlag: 'a', variant: 'b' },
      { featureFlag: 'c' },
      { featureFlag: 'd', variant: 'e' }
    ])
  })

  it('clears a single feature flag', () => {
    const updateFeatureFlags = jest.fn()

    const { client } = makeClient({ updateFeatureFlags })

    client.addFeatureFlag('a', 'b')
    client.addFeatureFlags([{ name: 'c', variant: null }, { name: 'd', variant: 'e' }])
    client.clearFeatureFlag('d')

    expect(client._features).toStrictEqual([{ name: 'a', variant: 'b' }, { name: 'c', variant: null }, null])

    expect(updateFeatureFlags).toHaveBeenCalledTimes(3)
    expect(updateFeatureFlags).toHaveBeenNthCalledWith(1, [{ featureFlag: 'a', variant: 'b' }])
    expect(updateFeatureFlags).toHaveBeenNthCalledWith(2, [
      { featureFlag: 'a', variant: 'b' },
      { featureFlag: 'c' },
      { featureFlag: 'd', variant: 'e' }
    ])
    expect(updateFeatureFlags).toHaveBeenNthCalledWith(3, [
      { featureFlag: 'a', variant: 'b' },
      { featureFlag: 'c' }
    ])
  })

  it('clears all feature flags', () => {
    const updateFeatureFlags = jest.fn()

    const { client } = makeClient({ updateFeatureFlags })

    client.addFeatureFlag('a', 'b')
    client.addFeatureFlags([{ name: 'c', variant: null }, { name: 'd', variant: 'e' }])
    client.clearFeatureFlags()

    expect(client._features).toStrictEqual([])

    expect(updateFeatureFlags).toHaveBeenCalledTimes(3)
    expect(updateFeatureFlags).toHaveBeenNthCalledWith(1, [{ featureFlag: 'a', variant: 'b' }])
    expect(updateFeatureFlags).toHaveBeenNthCalledWith(2, [
      { featureFlag: 'a', variant: 'b' },
      { featureFlag: 'c' },
      { featureFlag: 'd', variant: 'e' }
    ])
    expect(updateFeatureFlags).toHaveBeenNthCalledWith(3, [])
  })

  it('logs errors thrown from updating context', () => {
    const { client } = makeClient({
      updateContext: () => { throw new Error('wrong thing') }
    })

    client.setContext('some invalid context')
    const error = client._logger.error as jest.Mock<Function>
    expect(error.mock.calls.length).toBe(1)
    expect(error.mock.calls[0][0].message).toContain('wrong thing')
  })

  it('logs errors thrown from adding breadcrumbs', () => {
    const { client } = makeClient({
      leaveBreadcrumb: () => { throw new Error('wrong thing') }
    })
    client.leaveBreadcrumb('Spin', { direction: 'ccw', deg: '90' })
    const error = client._logger.error as jest.Mock<Function>
    expect(error.mock.calls.length).toBe(1)
    expect(error.mock.calls[0][0].message).toContain('wrong thing')
  })

  it('logs errors thrown from adding metadata', () => {
    const { client } = makeClient({
      updateMetadata: () => { throw new Error('wrong thing') }
    })
    client.addMetadata('widget', { id: '14', count: 340 })
    const error = client._logger.error as jest.Mock<Function>
    expect(error.mock.calls.length).toBe(1)
    expect(error.mock.calls[0][0].message).toContain('wrong thing')
  })

  it('logs errors thrown from clearing metadata', () => {
    const { client } = makeClient({
      updateMetadata: () => { throw new Error('wrong thing') }
    })
    client.clearMetadata('widget')
    const error = client._logger.error as jest.Mock<Function>
    expect(error.mock.calls.length).toBe(1)
    expect(error.mock.calls[0][0].message).toContain('wrong thing')
  })

  it('logs errors thrown from updating user info', () => {
    const { client } = makeClient({
      updateUser: () => { throw new Error('wrong thing') }
    })
    client.setUser('404', 'tim@example.com', undefined)
    const error = client._logger.error as jest.Mock<Function>
    expect(error.mock.calls.length).toBe(1)
    expect(error.mock.calls[0][0].message).toContain('wrong thing')
  })

  it('logs errors thrown from updating feature flags', () => {
    const { client } = makeClient({
      updateFeatureFlags: () => { throw new Error('wrong thing') }
    })

    client.addFeatureFlag('a', 'b')

    const error = client._logger.error as jest.Mock<Function>

    expect(error.mock.calls.length).toBe(1)
    expect(error.mock.calls[0][0].message).toContain('wrong thing')
  })

  it('does not sync data to the NativeClient if enabledErrorTypes.nativeCrashes is disabled', () => {
    const NativeClient = {
      leaveBreadcrumb: jest.fn(),
      updateUser: jest.fn(),
      updateContext: jest.fn(),
      updateMetadata: jest.fn(),
      updateFeatureFlags: jest.fn()
    }

    const { client } = makeClient(NativeClient, { enabledErrorTypes: { nativeCrashes: false } })
    client.leaveBreadcrumb('no sync')
    client.setUser('1234', 'user@example.com', 'Ben')
    client.setContext('no sync')
    client.addMetadata('no sync', { id: '14', count: 340 })
    client.addFeatureFlag('no', 'sync')

    expect(NativeClient.leaveBreadcrumb).not.toHaveBeenCalled()
    expect(NativeClient.updateUser).not.toHaveBeenCalled()
    expect(NativeClient.updateContext).not.toHaveBeenCalled()
    expect(NativeClient.updateMetadata).not.toHaveBeenCalled()
    expect(NativeClient.updateFeatureFlags).not.toHaveBeenCalled()
  })

  it('does not sync data to the NativeClient if autoDetectErrors is disabled', () => {
    const NativeClient = {
      leaveBreadcrumb: jest.fn(),
      updateUser: jest.fn(),
      updateContext: jest.fn(),
      updateMetadata: jest.fn(),
      updateFeatureFlags: jest.fn()
    }

    const { client } = makeClient(NativeClient, { autoDetectErrors: false })
    client.leaveBreadcrumb('no sync')
    client.setUser('1234', 'user@example.com', 'Ben')
    client.setContext('no sync')
    client.addMetadata('no sync', { id: '14', count: 340 })
    client.addFeatureFlag('no', 'sync')

    expect(NativeClient.leaveBreadcrumb).not.toHaveBeenCalled()
    expect(NativeClient.updateUser).not.toHaveBeenCalled()
    expect(NativeClient.updateContext).not.toHaveBeenCalled()
    expect(NativeClient.updateMetadata).not.toHaveBeenCalled()
    expect(NativeClient.updateFeatureFlags).not.toHaveBeenCalled()
  })
})
