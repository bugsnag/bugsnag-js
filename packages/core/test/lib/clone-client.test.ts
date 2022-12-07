import Client from '../../client'
import clone from '../../lib/clone-client'

const apiKey = 'abcabcabcabcabcabcabc1234567890f'

describe('@bugsnag/core/lib/clone-client', () => {
  describe('clone', () => {
    it('clones a client', () => {
      const original = new Client({ apiKey })
      const cloned = clone(original)

      expect(cloned._config.apiKey).toEqual(apiKey)
      expect(cloned).not.toBe(original)
    })

    it('clones breadcrumbs', () => {
      const original = new Client({ apiKey })
      original.leaveBreadcrumb('abc', { a: 1 }, 'navigation')

      const cloned = clone(original)

      expect(cloned._breadcrumbs).not.toBe(original._breadcrumbs)
      expect(cloned._breadcrumbs).toHaveLength(1)
      expect(cloned._breadcrumbs[0].type).toEqual('navigation')
      expect(cloned._breadcrumbs[0].message).toEqual('abc')
      expect(cloned._breadcrumbs[0].metadata).toEqual({ a: 1 })

      // leaving another breadcrumb should not affect the clone
      original.leaveBreadcrumb('another', { x: 2 }, 'log')

      expect(cloned._breadcrumbs).toHaveLength(1)
      expect(cloned._breadcrumbs[0].type).toEqual('navigation')
      expect(cloned._breadcrumbs[0].message).toEqual('abc')
      expect(cloned._breadcrumbs[0].metadata).toEqual({ a: 1 })

      expect(original._breadcrumbs).toHaveLength(2)
    })

    it('clones metadata', () => {
      const original = new Client({ apiKey })
      original.addMetadata('abc', { a: 1, b: 2, c: 3 })
      original.addMetadata('xyz', { x: 9, y: 8, z: 7 })

      const cloned = clone(original)
      expect(cloned._metadata).not.toBe(original._metadata)
      expect(cloned._metadata).toEqual({
        abc: { a: 1, b: 2, c: 3 },
        xyz: { x: 9, y: 8, z: 7 }
      })

      // changing the original's metadata should not affect the clone
      original.addMetadata('abc', { d: 4 })
      original.clearMetadata('abc', 'c')
      original.clearMetadata('xyz')

      expect(cloned._metadata).toEqual({
        abc: { a: 1, b: 2, c: 3 },
        xyz: { x: 9, y: 8, z: 7 }
      })

      expect(original._metadata).toEqual({ abc: { a: 1, b: 2, d: 4 } })
    })

    it('clones feature flags', () => {
      const original = new Client({ apiKey })
      original.addFeatureFlag('a', '1')
      original.addFeatureFlags([
        { name: 'b', variant: '2' },
        { name: 'c' }
      ])

      const cloned = clone(original)
      expect(cloned._features).not.toBe(original._features)
      expect(cloned._features).toEqual([
        { name: 'a', variant: '1' },
        { name: 'b', variant: '2' },
        { name: 'c', variant: null }
      ])
      expect(cloned._featuresIndex).toEqual({ a: 0, b: 1, c: 2 })

      // changing the original's feature flags should not affect the clone
      original.clearFeatureFlags()

      expect(cloned._features).toEqual([
        { name: 'a', variant: '1' },
        { name: 'b', variant: '2' },
        { name: 'c', variant: null }
      ])
      expect(cloned._featuresIndex).toEqual({ a: 0, b: 1, c: 2 })
      expect(original._features).toEqual([])
      expect(original._featuresIndex).toEqual({})
    })

    it('clones user information', () => {
      const original = new Client({ apiKey })
      original.setUser('123', 'user@bugsnag.com', 'bug snag')

      const cloned = clone(original)
      expect(cloned.getUser()).toEqual({
        id: '123',
        email: 'user@bugsnag.com',
        name: 'bug snag'
      })
      expect(cloned._user).not.toBe(original._user)

      // changing the original's user should not affect the clone
      original.setUser()

      expect(cloned.getUser()).toEqual({
        id: '123',
        email: 'user@bugsnag.com',
        name: 'bug snag'
      })
      expect(original.getUser()).toEqual({})
    })

    it('clones context', () => {
      const original = new Client({ apiKey })
      original.setContext('contextual')

      const cloned = clone(original)
      expect(cloned.getContext()).toEqual('contextual')

      // changing the original's context should not affect the clone
      original.setContext('lautxetnoc')

      expect(cloned.getContext()).toEqual('contextual')
      expect(original.getContext()).toEqual('lautxetnoc')
    })

    it('clones on error callbacks', () => {
      const onError1 = jest.fn()
      const onError2 = jest.fn()

      const original = new Client({ apiKey })
      original.addOnError(onError1)

      const cloned = clone(original)
      expect(cloned._cbs.e).not.toBe(original._cbs.e)

      // @ts-ignore
      cloned._cbs.e.forEach(cb => { cb() })
      expect(onError1).toHaveBeenCalledTimes(1)
      expect(onError2).toHaveBeenCalledTimes(0)

      // adding a new callback should not affect the clone
      original.addOnError(onError2)

      // @ts-ignore
      cloned._cbs.e.forEach(cb => { cb() })
      expect(onError1).toHaveBeenCalledTimes(2)
      expect(onError2).toHaveBeenCalledTimes(0)

      // @ts-ignore
      original._cbs.e.forEach(cb => { cb() })
      expect(onError1).toHaveBeenCalledTimes(3)
      expect(onError2).toHaveBeenCalledTimes(1)
    })

    it('clones on session callbacks', () => {
      const onSession1 = jest.fn()
      const onSession2 = jest.fn()

      const original = new Client({ apiKey })
      original.addOnSession(onSession1)

      const cloned = clone(original)
      expect(cloned._cbs.s).not.toBe(original._cbs.s)

      // @ts-ignore
      cloned._cbs.s.forEach(cb => { cb() })
      expect(onSession1).toHaveBeenCalledTimes(1)
      expect(onSession2).toHaveBeenCalledTimes(0)

      // adding a new callback should not affect the clone
      original.addOnSession(onSession2)

      // @ts-ignore
      cloned._cbs.s.forEach(cb => { cb() })
      expect(onSession1).toHaveBeenCalledTimes(2)
      expect(onSession2).toHaveBeenCalledTimes(0)

      // @ts-ignore
      original._cbs.s.forEach(cb => { cb() })
      expect(onSession1).toHaveBeenCalledTimes(3)
      expect(onSession2).toHaveBeenCalledTimes(1)
    })

    it('clones on session payload callbacks', () => {
      const onSessionPayload1 = jest.fn()
      const onSessionPayload2 = jest.fn()

      const original = new Client({ apiKey })
      original._addOnSessionPayload(onSessionPayload1)

      const cloned = clone(original)
      expect(cloned._cbs.sp).not.toBe(original._cbs.sp)

      // @ts-ignore
      cloned._cbs.sp.forEach(cb => { cb() })
      expect(onSessionPayload1).toHaveBeenCalledTimes(1)
      expect(onSessionPayload2).toHaveBeenCalledTimes(0)

      // adding a new callback should not affect the clone
      original._addOnSessionPayload(onSessionPayload2)

      // @ts-ignore
      cloned._cbs.sp.forEach(cb => { cb() })
      expect(onSessionPayload1).toHaveBeenCalledTimes(2)
      expect(onSessionPayload2).toHaveBeenCalledTimes(0)

      // @ts-ignore
      original._cbs.sp.forEach(cb => { cb() })
      expect(onSessionPayload1).toHaveBeenCalledTimes(3)
      expect(onSessionPayload2).toHaveBeenCalledTimes(1)
    })

    it('clones on breadcrumb callbacks', () => {
      const onBreadcrumb1 = jest.fn()
      const onBreadcrumb2 = jest.fn()

      const original = new Client({ apiKey })
      original.addOnBreadcrumb(onBreadcrumb1)

      const cloned = clone(original)
      expect(cloned._cbs.b).not.toBe(original._cbs.b)

      // @ts-ignore
      cloned._cbs.b.forEach(cb => { cb() })
      expect(onBreadcrumb1).toHaveBeenCalledTimes(1)
      expect(onBreadcrumb2).toHaveBeenCalledTimes(0)

      // adding a new callback should not affect the clone
      original.addOnBreadcrumb(onBreadcrumb2)

      // @ts-ignore
      cloned._cbs.b.forEach(cb => { cb() })
      expect(onBreadcrumb1).toHaveBeenCalledTimes(2)
      expect(onBreadcrumb2).toHaveBeenCalledTimes(0)

      // @ts-ignore
      original._cbs.b.forEach(cb => { cb() })
      expect(onBreadcrumb1).toHaveBeenCalledTimes(3)
      expect(onBreadcrumb2).toHaveBeenCalledTimes(1)
    })

    it('assigns a logger', () => {
      const logger = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
      }

      const original = new Client({ apiKey, logger })
      const cloned = clone(original)

      expect(cloned._logger).toBe(original._logger)
    })

    it('assigns a delivery delegate', () => {
      const delivery = () => ({
        sendEvent: jest.fn(),
        sendSession: jest.fn()
      })

      const original = new Client({ apiKey })
      original._setDelivery(delivery)

      const cloned = clone(original)

      expect(cloned._delivery).toBe(original._delivery)
    })

    it('assigns a session delegate', () => {
      const sessionDelegate = {
        startSession: jest.fn(),
        resumeSession: jest.fn(),
        pauseSession: jest.fn()
      }

      const original = new Client({ apiKey })
      original._sessionDelegate = sessionDelegate

      const cloned = clone(original)

      expect(cloned._sessionDelegate).toBe(original._sessionDelegate)
    })
  })

  describe('registerCallback', () => {
    it('allows registering callbacks that are called when a client is cloned', () => {
      const callback1 = jest.fn()
      const callback2 = jest.fn()
      const callback3 = jest.fn()

      clone.registerCallback(callback1)
      clone.registerCallback(callback2)
      clone.registerCallback(callback3)

      const original = new Client({ apiKey })

      expect(callback1).not.toHaveBeenCalled()
      expect(callback2).not.toHaveBeenCalled()
      expect(callback3).not.toHaveBeenCalled()

      clone(original)

      expect(callback1).toHaveBeenCalledTimes(1)
      expect(callback2).toHaveBeenCalledTimes(1)
      expect(callback3).toHaveBeenCalledTimes(1)

      clone(original)

      expect(callback1).toHaveBeenCalledTimes(2)
      expect(callback2).toHaveBeenCalledTimes(2)
      expect(callback3).toHaveBeenCalledTimes(2)
    })

    it('passes the clone to the callbacks', () => {
      const callback1 = jest.fn()
      const callback2 = jest.fn()
      const callback3 = jest.fn()

      clone.registerCallback(callback1)
      clone.registerCallback(callback2)
      clone.registerCallback(callback3)

      const original = new Client({ apiKey })

      expect(callback1).not.toHaveBeenCalled()
      expect(callback2).not.toHaveBeenCalled()
      expect(callback3).not.toHaveBeenCalled()

      const cloned = clone(original)

      expect(callback1).toHaveBeenCalledWith(cloned)
      expect(callback2).toHaveBeenCalledWith(cloned)
      expect(callback3).toHaveBeenCalledWith(cloned)

      const cloned2 = clone(original)

      expect(callback1).toHaveBeenCalledWith(cloned2)
      expect(callback2).toHaveBeenCalledWith(cloned2)
      expect(callback3).toHaveBeenCalledWith(cloned2)

      // the callbacks should not be called with the original client
      expect(callback1).not.toHaveBeenCalledWith(original)
      expect(callback2).not.toHaveBeenCalledWith(original)
      expect(callback3).not.toHaveBeenCalledWith(original)
    })

    it('calls callbacks in the order they are registered', () => {
      const order: string[] = []

      const callback1 = () => { order.push('callback1') }
      const callback2 = () => { order.push('callback2') }
      const callback3 = () => { order.push('callback3') }

      clone.registerCallback(callback1)
      clone.registerCallback(callback2)
      clone.registerCallback(callback3)

      const original = new Client({ apiKey })

      expect(order).toEqual([])

      clone(original)

      expect(order).toEqual(['callback1', 'callback2', 'callback3'])

      clone(original)

      expect(order).toEqual(['callback1', 'callback2', 'callback3', 'callback1', 'callback2', 'callback3'])
    })
  })
})
