import delegate from '../feature-flag-delegate'

describe('feature flag delegate', () => {
  describe('#add', () => {
    it('should do nothing if name is not passed', () => {
      const existingFeatures = { abc: 'xyz' }

      delegate.add(existingFeatures)

      expect(existingFeatures).toStrictEqual({ abc: 'xyz' })
    })

    it('should do nothing if name is undefined but variant is passed', () => {
      const existingFeatures = { abc: 'xyz' }

      delegate.add(existingFeatures, undefined, '???')

      expect(existingFeatures).toStrictEqual({ abc: 'xyz' })
    })

    it('should do nothing if name is null but variant is passed', () => {
      const existingFeatures = { abc: 'xyz' }

      delegate.add(existingFeatures, null, '???')

      expect(existingFeatures).toStrictEqual({ abc: 'xyz' })
    })

    it('should add a feature flag with only a name if variant is undefined', () => {
      const existingFeatures = {}

      delegate.add(existingFeatures, 'good_feature')

      expect(existingFeatures).toStrictEqual({ good_feature: null })
    })

    it('should add a feature flag with only a name if variant is null', () => {
      const existingFeatures = {}

      delegate.add(existingFeatures, 'ok_feature', null)

      expect(existingFeatures).toStrictEqual({ ok_feature: null })
    })

    it('should add a feature flag with a variant', () => {
      const existingFeatures = {}

      delegate.add(existingFeatures, 'cool_feature', 'very ant')

      expect(existingFeatures).toStrictEqual({ cool_feature: 'very ant' })
    })

    it.each([
      [12345, '12345'],
      [0, '0'],
      [true, 'true'],
      [false, 'false'],
      [[1, 2, 3], '[1,2,3]'],
      [[], '[]'],
      [{ a: 1, b: 2, c: { d: 3 } }, '{"a":1,"b":2,"c":{"d":3}}'],
      [{ abc: 123, toString () { throw new Error('nope') } }, '{"abc":123}']
    ])('should handle non-string variant: %p', (variant, expected) => {
      const existingFeatures = {}

      delegate.add(existingFeatures, 'some_feature', variant)

      expect(existingFeatures).toStrictEqual({ some_feature: expected })
    })

    it('should overwrite an existing flag if the name already exists', () => {
      const existingFeatures = { a: 'a', b: 'b', c: 'c', d: 'd', e: 'e' }

      delegate.add(existingFeatures, 'b', 'x')
      delegate.add(existingFeatures, 'e', 'y')
      delegate.add(existingFeatures, 'a', 'z')

      expect(existingFeatures).toStrictEqual({ a: 'z', b: 'x', c: 'c', d: 'd', e: 'y' })
    })
  })

  describe('#merge', () => {
    it('should set feature flags when there are no existing flags', () => {
      const existingFeatures = {}

      delegate.merge(existingFeatures, [
        { name: 'a', variant: 'b' },
        { name: 'c', variant: 'd' }
      ])

      expect(existingFeatures).toStrictEqual({ a: 'b', c: 'd' })
    })

    it('should merge feature flags with existing flags', () => {
      const existingFeatures = { a: 'a', b: 'b', c: 'c', d: 'd', e: 'e' }

      delegate.merge(existingFeatures, [
        { name: 'b', variant: 'x' },
        { name: 'e', variant: 'y' },
        { name: 'a', variant: 'z' }
      ])

      expect(existingFeatures).toStrictEqual({ a: 'z', b: 'x', c: 'c', d: 'd', e: 'y' })
    })

    it('should handle non-string variants', () => {
      const existingFeatures = {
        a: 'a',
        b: 'b',
        c: 'c',
        d: 'd',
        e: 'e',
        f: 'f',
        g: 'g',
        h: 'h',
        i: 'i',
        j: 'j',
        k: 'k',
        l: 'l',
        m: 'm',
        n: 'n',
        o: 'o',
        p: 'p'
      }

      delegate.merge(existingFeatures, [
        { name: 'a', variant: 12345 },
        { name: 'c', variant: 0 },
        { name: 'e', variant: true },
        { name: 'g', variant: false },
        { name: 'i', variant: [1, 2, 3] },
        { name: 'k', variant: [] },
        { name: 'm', variant: { a: 1, b: 2, c: { d: 3 } } },
        { name: 'o', variant: { abc: 123, toString () { throw new Error('nope') } } }
      ])

      expect(existingFeatures).toStrictEqual({
        a: '12345',
        b: 'b',
        c: '0',
        d: 'd',
        e: 'true',
        f: 'f',
        g: 'false',
        h: 'h',
        i: '[1,2,3]',
        j: 'j',
        k: '[]',
        l: 'l',
        m: '{"a":1,"b":2,"c":{"d":3}}',
        n: 'n',
        o: '{"abc":123}',
        p: 'p'
      })
    })

    it('should ignore feature flags with invalid/missing names', () => {
      const existingFeatures = { a: 'a', b: 'b', c: 'c', d: 'd', e: 'e' }

      delegate.merge(existingFeatures, [
        { name: 'b', variant: 'x' },
        { variant: 'y' },
        { name: 'a', variant: 'z' },
        { name: [1, 2, 3], variant: 'zzz' },
        { name: 1234, variant: 'oooo' },
        { name: { a: 1 }, variant: 'oooo' }
      ])

      expect(existingFeatures).toStrictEqual({ a: 'z', b: 'x', c: 'c', d: 'd', e: 'e' })
    })

    it('should do nothing if not given an array of features', () => {
      const existingFeatures = { a: 'a', b: 'b', c: 'c', d: 'd', e: 'e' }

      delegate.merge(existingFeatures, { a: 'a', b: 'b', c: 'c' })

      expect(existingFeatures).toStrictEqual({ a: 'a', b: 'b', c: 'c', d: 'd', e: 'e' })
    })

    it('should skip feature flags that are not objects', () => {
      const existingFeatures = { a: 'a', b: 'b', c: 'c', d: 'd', e: 'e' }

      delegate.merge(existingFeatures, [
        { name: 'b', variant: 'x' },
        'name: yes',
        undefined,
        { name: 'a', variant: 'z' },
        null,
        1234,
        { name: 'e', variant: 'oooo' }
      ])

      expect(existingFeatures).toStrictEqual({ a: 'z', b: 'x', c: 'c', d: 'd', e: 'oooo' })
    })
  })

  describe('#toEventApi', () => {
    it('should convert a map into the event API format', () => {
      const features = {}

      delegate.add(features, 'a', 'b')
      delegate.merge(features, [
        { name: 'c', variant: 'd' },
        { name: 'e' },
        { name: 'f', variant: 'g' }
      ])

      expect(features).toStrictEqual({ a: 'b', c: 'd', e: null, f: 'g' })

      expect(delegate.toEventApi(features)).toStrictEqual([
        { featureFlag: 'a', variant: 'b' },
        { featureFlag: 'c', variant: 'd' },
        { featureFlag: 'e' },
        { featureFlag: 'f', variant: 'g' }
      ])
    })

    it('should handle an empty object', () => {
      expect(delegate.toEventApi({})).toStrictEqual([])
    })
  })
})
