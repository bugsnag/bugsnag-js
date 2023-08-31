import Bugsnag from '../src/notifier'

describe('node notifier', () => {
  beforeAll(() => {
    jest.spyOn(console, 'debug').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  beforeEach(() => {
    // @ts-ignore
    Bugsnag._client = null
  })

  describe('isStarted()', () => {
    it('returns false when the notifier has not been initialised', () => {
      expect(Bugsnag.isStarted()).toBe(false)
    })

    it('returns true when the notifier has been initialised', () => {
      Bugsnag.start('abcd12abcd12abcd12abcd12abcd12abcd')
      expect(Bugsnag.isStarted()).toBe(true)
    })
  })

  describe('addMetadata()', () => {
    it('adds metadata to the client', () => {
      Bugsnag.start('abcd12abcd12abcd12abcd12abcd12abcd')
      Bugsnag.addMetadata('test', { meta: 'data' })
      // @ts-ignore
      expect(Bugsnag._client._metadata).toStrictEqual({ test: { meta: 'data' } })
    })

    describe('when in an async context', () => {
      it('adds meta data to the cloned client not not the base client', () => {
        Bugsnag.start('abcd12abcd12abcd12abcd12abcd12abcd')
        const contextualize = Bugsnag.getPlugin('contextualize')

        contextualize(() => {
          Bugsnag.addMetadata('test', { meta: 'data' })
          // @ts-ignore
          expect(Bugsnag._client._clientContext.getStore()._metadata).toStrictEqual({ test: { meta: 'data' } })
        })

        // @ts-ignore
        expect(Bugsnag._client._metadata).toStrictEqual({})
      })
    })
  })

  describe('getMetadata()', () => {
    it('retrieves metadata previously set on the client', () => {
      Bugsnag.start('abcd12abcd12abcd12abcd12abcd12abcd')
      Bugsnag.addMetadata('test', { meta: 'data' })
      // @ts-ignore
      expect(Bugsnag._client._metadata).toStrictEqual({ test: { meta: 'data' } })

      expect(Bugsnag.getMetadata('test')).toStrictEqual({ meta: 'data' })
    })

    describe('when in an async context', () => {
      it('retrieves metadata previously set on the cloned client not not the base client', () => {
        Bugsnag.start('abcd12abcd12abcd12abcd12abcd12abcd')
        const contextualize = Bugsnag.getPlugin('contextualize')

        contextualize(() => {
          Bugsnag.addMetadata('test', { meta: 'data' })
          // @ts-ignore
          expect(Bugsnag._client._clientContext.getStore()._metadata).toStrictEqual({ test: { meta: 'data' } })

          expect(Bugsnag.getMetadata('test')).toStrictEqual({ meta: 'data' })
        })

        // @ts-ignore
        expect(Bugsnag._client._metadata).toStrictEqual({})
        expect(Bugsnag.getMetadata('test')).toBeUndefined()
      })
    })
  })

  describe('clearMetadata()', () => {
    it('clears metadata previously set on the client', () => {
      Bugsnag.start('abcd12abcd12abcd12abcd12abcd12abcd')
      Bugsnag.addMetadata('test', { meta: 'data' })
      Bugsnag.clearMetadata('test')

      // @ts-ignore
      expect(Bugsnag._client._metadata).toStrictEqual({})
    })

    describe('when in an async context', () => {
      it('clears metadata previously set on the cloned client not not the base client', () => {
        Bugsnag.start('abcd12abcd12abcd12abcd12abcd12abcd')
        Bugsnag.addMetadata('test', { meta: 'data' })
        const contextualize = Bugsnag.getPlugin('contextualize')

        contextualize(() => {
          Bugsnag.addMetadata('test', { meta: 'data' })
          Bugsnag.clearMetadata('test')
          // @ts-ignore
          expect(Bugsnag._client._clientContext.getStore()._metadata).toStrictEqual({})
        })

        // @ts-ignore
        expect(Bugsnag._client._metadata).toStrictEqual({ test: { meta: 'data' } })
      })
    })
  })

  describe('addFeatureFlag()', () => {
    it('adds a feature flag to the client', () => {
      Bugsnag.start('abcd12abcd12abcd12abcd12abcd12abcd')
      Bugsnag.addFeatureFlag('test')
      // @ts-ignore
      expect(Bugsnag._client._features[0].name).toBe('test')
    })

    describe('when in an async context', () => {
      it('adds a feature flag to the cloned client not not the base client', () => {
        Bugsnag.start('abcd12abcd12abcd12abcd12abcd12abcd')
        const contextualize = Bugsnag.getPlugin('contextualize')

        contextualize(() => {
          Bugsnag.addFeatureFlag('test')
          // @ts-ignore
          expect(Bugsnag._client._clientContext.getStore()._features[0].name).toBe('test')
        })

        // @ts-ignore
        expect(Bugsnag._client._features.length).toBe(0)
      })
    })
  })

  describe('addFeatureFlags()', () => {
    it('adds feature flags to the client', () => {
      Bugsnag.start('abcd12abcd12abcd12abcd12abcd12abcd')
      Bugsnag.addFeatureFlags([{ name: 'test' }, { name: 'other' }])
      // @ts-ignore
      expect(Bugsnag._client._features).toStrictEqual([
        { name: 'test', variant: null },
        { name: 'other', variant: null }
      ])
    })

    describe('when in an async context', () => {
      it('adds feature flags to the cloned client not not the base client', () => {
        Bugsnag.start('abcd12abcd12abcd12abcd12abcd12abcd')
        const contextualize = Bugsnag.getPlugin('contextualize')

        contextualize(() => {
          Bugsnag.addFeatureFlags([{ name: 'test' }, { name: 'other' }])
          // @ts-ignore
          expect(Bugsnag._client._clientContext.getStore()._features).toStrictEqual([
            { name: 'test', variant: null },
            { name: 'other', variant: null }
          ])
        })

        // @ts-ignore
        expect(Bugsnag._client._features).toStrictEqual([])
      })
    })
  })

  describe('clearFeatureFlag()', () => {
    it('clears a feature flag set on the client', () => {
      Bugsnag.start('abcd12abcd12abcd12abcd12abcd12abcd')
      Bugsnag.addFeatureFlags([{ name: 'test' }, { name: 'other' }])
      Bugsnag.clearFeatureFlag('test')
      // @ts-ignore
      expect(Bugsnag._client._features).toStrictEqual([
        null,
        { name: 'other', variant: null }
      ])
    })

    describe('when in an async context', () => {
      it('clears a feature flag previously set on the cloned client not not the base client', () => {
        Bugsnag.start('abcd12abcd12abcd12abcd12abcd12abcd')
        Bugsnag.addFeatureFlags([{ name: 'test' }, { name: 'other' }])
        const contextualize = Bugsnag.getPlugin('contextualize')

        contextualize(() => {
          Bugsnag.addFeatureFlags([{ name: 'test' }, { name: 'other' }])
          Bugsnag.clearFeatureFlag('test')
          // @ts-ignore
          expect(Bugsnag._client._clientContext.getStore()._features).toStrictEqual([
            null,
            { name: 'other', variant: null }
          ])
        })

        // @ts-ignore
        expect(Bugsnag._client._features).toStrictEqual([
          { name: 'test', variant: null },
          { name: 'other', variant: null }
        ])
      })
    })
  })

  describe('clearFeatureFlags()', () => {
    it('clears feature flags set on the client', () => {
      Bugsnag.start('abcd12abcd12abcd12abcd12abcd12abcd')
      Bugsnag.addFeatureFlags([{ name: 'test' }, { name: 'other' }])
      Bugsnag.clearFeatureFlags()
      // @ts-ignore
      expect(Bugsnag._client._features).toStrictEqual([])
    })

    describe('when in an async context', () => {
      it('clears feature flags previously set on the cloned client not not the base client', () => {
        Bugsnag.start('abcd12abcd12abcd12abcd12abcd12abcd')
        Bugsnag.addFeatureFlags([{ name: 'test' }, { name: 'other' }])
        const contextualize = Bugsnag.getPlugin('contextualize')

        contextualize(() => {
          Bugsnag.addFeatureFlags([{ name: 'test' }, { name: 'other' }])
          Bugsnag.clearFeatureFlags()
          // @ts-ignore
          expect(Bugsnag._client._clientContext.getStore()._features).toStrictEqual([])
        })

        // @ts-ignore
        expect(Bugsnag._client._features).toStrictEqual([
          { name: 'test', variant: null },
          { name: 'other', variant: null }
        ])
      })
    })
  })

  describe('setContext() and getContext()', () => {
    it('sets the context on the client', () => {
      Bugsnag.start('abcd12abcd12abcd12abcd12abcd12abcd')
      expect(Bugsnag.getContext()).toBeUndefined()
      Bugsnag.setContext('my context')
      expect(Bugsnag.getContext()).toBe('my context')
    })

    describe('when in an async context', () => {
      it('sets the context on the cloned client not not the base client', () => {
        Bugsnag.start('abcd12abcd12abcd12abcd12abcd12abcd')
        const contextualize = Bugsnag.getPlugin('contextualize')

        contextualize(() => {
          Bugsnag.setContext('my context')
          expect(Bugsnag.getContext()).toBe('my context')
        })

        expect(Bugsnag.getContext()).toBeUndefined()
      })
    })
  })

  describe('setUser() and getUser()', () => {
    it('sets the context on the client', () => {
      Bugsnag.start('abcd12abcd12abcd12abcd12abcd12abcd')
      expect(Bugsnag.getUser()).toStrictEqual({})
      Bugsnag.setUser('my user id')
      expect(Bugsnag.getUser()).toStrictEqual({ id: 'my user id', email: undefined, name: undefined })
    })

    describe('when in an async context', () => {
      it('sets the context on the cloned client not not the base client', () => {
        Bugsnag.start('abcd12abcd12abcd12abcd12abcd12abcd')
        const contextualize = Bugsnag.getPlugin('contextualize')

        contextualize(() => {
          Bugsnag.setUser('my user id')
          expect(Bugsnag.getUser()).toStrictEqual({ id: 'my user id', email: undefined, name: undefined })
        })

        expect(Bugsnag.getUser()).toStrictEqual({})
      })
    })
  })

  describe('leaveBreadcrumb()', () => {
    it('adds a breadcrumb to the client', () => {
      Bugsnag.start('abcd12abcd12abcd12abcd12abcd12abcd')
      Bugsnag.leaveBreadcrumb('test')
      // @ts-ignore
      expect(Bugsnag._client._breadcrumbs[0].message).toBe('test')
    })

    describe('when in an async context', () => {
      it('adds a breadcrumb to the cloned client not not the base client', () => {
        Bugsnag.start('abcd12abcd12abcd12abcd12abcd12abcd')
        const contextualize = Bugsnag.getPlugin('contextualize')

        contextualize(() => {
          Bugsnag.leaveBreadcrumb('test')
          // @ts-ignore
          expect(Bugsnag._client._clientContext.getStore()._breadcrumbs[0].message).toBe('test')
        })

        // @ts-ignore
        expect(Bugsnag._client._breadcrumbs.length).toBe(0)
      })
    })
  })
})
