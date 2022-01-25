import Client from '../../client'
import cloneClient from '../clone-client'

describe('clone-client', () => {
  it('should not copy the configuration', () => {
    const apiKey = '123456abcdef123456abcdef123456ab'

    const original = new Client({ apiKey })
    const clone = cloneClient(original)

    expect(clone._config).toBe(original._config)
    expect(clone._config.apiKey).toBe(original._config.apiKey)
  })

  it('should not copy the logger', () => {
    const logger = {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {}
    }

    const original = new Client({ apiKey: '123456abcdef123456abcdef123456ab', logger })
    const clone = cloneClient(original)

    expect(clone._logger).toBe(logger)
    expect(clone._logger).toBe(original._logger)
  })

  it('should not copy the delivery implementation', () => {
    const delivery = {
      sendEvent: () => {},
      sendSession: () => {}
    }

    const original = new Client({ apiKey: '123456abcdef123456abcdef123456ab' })
    original._setDelivery(() => delivery)

    const clone = cloneClient(original)

    expect(clone._delivery).toBe(delivery)
    expect(clone._delivery).toBe(original._delivery)
  })

  it('should not copy the session delegate', () => {
    const sessionDelegate = {
      startSession: (client: Client) => client,
      resumeSession: (client: Client) => client,
      pauseSession: () => {}
    }

    const original = new Client({ apiKey: '123456abcdef123456abcdef123456ab' })
    original._sessionDelegate = sessionDelegate

    const clone = cloneClient(original)

    expect(clone._sessionDelegate).toBe(sessionDelegate)
    expect(clone._sessionDelegate).toBe(original._sessionDelegate)
  })

  it('should not copy the context', () => {
    const original = new Client({ apiKey: '123456abcdef123456abcdef123456ab' })
    original.setContext('abc')

    const clone = cloneClient(original)

    expect(clone.getContext()).toBe('abc')
    expect(clone.getContext()).toBe(original.getContext())

    // changing the clone's context shouldn't affect the original's context
    clone.setContext('xyz')

    expect(clone.getContext()).toBe('xyz')
    expect(original.getContext()).toBe('abc')
  })

  it('should clone breadcrumbs', () => {
    const original = new Client({ apiKey: '123456abcdef123456abcdef123456ab' })
    original.leaveBreadcrumb('breadcrumb 1')

    expect(original._breadcrumbs).toHaveLength(1)
    const breadcrumb = original._breadcrumbs[0]

    const clone = cloneClient(original)

    expect(clone._breadcrumbs).toHaveLength(1)
    expect(clone._breadcrumbs[0]).toBe(breadcrumb)
    expect(clone._breadcrumbs).not.toBe(original._breadcrumbs)

    // leaving a new breadcrumb on the clone shouldn't affect the original
    clone.leaveBreadcrumb('breadcrumb 2')

    expect(clone._breadcrumbs).toHaveLength(2)
    expect(original._breadcrumbs).toHaveLength(1)
  })

  it('should clone metadata', () => {
    const original = new Client({ apiKey: '123456abcdef123456abcdef123456ab' })
    original.addMetadata('abc', 'xyz', 123)

    const clone = cloneClient(original)

    expect(clone._metadata).toStrictEqual({ abc: { xyz: 123 } })
    expect(clone._metadata).not.toBe(original._metadata)

    // changing the clone's metadata shouldn't affect the original
    clone.addMetadata('abc', 'xyz', 999)

    expect(clone._metadata).toStrictEqual({ abc: { xyz: 999 } })
    expect(original._metadata).toStrictEqual({ abc: { xyz: 123 } })
  })

  it('should clone feature flags', () => {
    const original = new Client({ apiKey: '123456abcdef123456abcdef123456ab' })
    original.addFeatureFlag('abc', '123')

    const clone = cloneClient(original)

    expect(clone._features).toStrictEqual({ abc: '123' })
    expect(clone._features).not.toBe(original._features)

    // changing the clone's feature flags shouldn't affect the original
    clone.addFeatureFlag('xyz', '999')

    expect(clone._features).toStrictEqual({ abc: '123', xyz: '999' })
    expect(original._features).toStrictEqual({ abc: '123' })
  })

  it('should clone user information', () => {
    const original = new Client({ apiKey: '123456abcdef123456abcdef123456ab' })
    original.setUser('123', 'abc@example.com', 'abc')

    const clone = cloneClient(original)

    expect(clone.getUser()).toStrictEqual({ id: '123', email: 'abc@example.com', name: 'abc' })
    expect(clone.getUser()).not.toBe(original.getUser())

    // changing the clone's user shouldn't affect the original
    clone.setUser('999', 'xyz@example.com', 'xyz')

    expect(clone.getUser()).toStrictEqual({ id: '999', email: 'xyz@example.com', name: 'xyz' })
    expect(original.getUser()).toStrictEqual({ id: '123', email: 'abc@example.com', name: 'abc' })
  })

  it('should clone the on error callback array', () => {
    const onError = () => {}

    const original = new Client({ apiKey: '123456abcdef123456abcdef123456ab' })
    original.addOnError(onError)

    const clone = cloneClient(original)

    expect(clone._cbs.e).toHaveLength(1)
    expect(clone._cbs.e[0]).toBe(onError)
    expect(clone._cbs.e).not.toBe(original._cbs.e)

    // changing the clone's callbacks shouldn't affect the original
    clone.addOnError(onError)

    expect(clone._cbs.e).toHaveLength(2)
    expect(original._cbs.e).toHaveLength(1)
  })

  it('should clone the on session callback array', () => {
    const onSession = () => {}

    const original = new Client({ apiKey: '123456abcdef123456abcdef123456ab' })
    original.addOnSession(onSession)

    const clone = cloneClient(original)

    expect(clone._cbs.s).toHaveLength(1)
    expect(clone._cbs.s[0]).toBe(onSession)
    expect(clone._cbs.s).not.toBe(original._cbs.s)

    // changing the clone's callbacks shouldn't affect the original
    clone.addOnSession(onSession)

    expect(clone._cbs.s).toHaveLength(2)
    expect(original._cbs.s).toHaveLength(1)
  })

  it('should clone the on session payload callback array', () => {
    const onSessionPayload = () => {}

    const original = new Client({ apiKey: '123456abcdef123456abcdef123456ab' })
    original._addOnSessionPayload(onSessionPayload)

    const clone = cloneClient(original)

    expect(clone._cbs.sp).toHaveLength(1)
    expect(clone._cbs.sp[0]).toBe(onSessionPayload)
    expect(clone._cbs.sp).not.toBe(original._cbs.sp)

    // changing the clone's callbacks shouldn't affect the original
    clone._addOnSessionPayload(onSessionPayload)

    expect(clone._cbs.sp).toHaveLength(2)
    expect(original._cbs.sp).toHaveLength(1)
  })

  it('should clone the on breadcrumb callback array', () => {
    const onBreadcrumb = () => {}

    const original = new Client({ apiKey: '123456abcdef123456abcdef123456ab' })
    original.addOnBreadcrumb(onBreadcrumb)

    const clone = cloneClient(original)

    expect(clone._cbs.b).toHaveLength(1)
    expect(clone._cbs.b[0]).toBe(onBreadcrumb)
    expect(clone._cbs.b).not.toBe(original._cbs.b)

    // changing the clone's callbacks shouldn't affect the original
    clone.addOnBreadcrumb(onBreadcrumb)

    expect(clone._cbs.b).toHaveLength(2)
    expect(original._cbs.b).toHaveLength(1)
  })
})
