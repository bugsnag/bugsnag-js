import delegate from '../feature-flag-delegate'

describe('feature flag delegate', () => {
  describe('#add', () => {
    it('should do nothing if name is not passed', () => {
      const existingFeatures = [{ name: 'abc', variant: 'xyz' }]
      const existingFeaturesIndex = { abc: 0 }

      delegate.add(existingFeatures, existingFeaturesIndex)

      expect(existingFeatures).toStrictEqual([{ name: 'abc', variant: 'xyz' }])
      expect(existingFeaturesIndex).toStrictEqual({ abc: 0 })
    })

    it('should do nothing if name is undefined but variant is passed', () => {
      const existingFeatures = [{ name: 'abc', variant: 'xyz' }]
      const existingFeaturesIndex = { abc: 0 }

      delegate.add(existingFeatures, existingFeaturesIndex, undefined, '???')

      expect(existingFeatures).toStrictEqual([{ name: 'abc', variant: 'xyz' }])
      expect(existingFeaturesIndex).toStrictEqual({ abc: 0 })
    })

    it('should do nothing if name is null but variant is passed', () => {
      const existingFeatures = [{ name: 'abc', variant: 'xyz' }]
      const existingFeaturesIndex = { abc: 0 }

      delegate.add(existingFeatures, existingFeaturesIndex, null, '???')

      expect(existingFeatures).toStrictEqual([{ name: 'abc', variant: 'xyz' }])
      expect(existingFeaturesIndex).toStrictEqual({ abc: 0 })
    })

    it('should add a feature flag with only a name if variant is undefined', () => {
      const existingFeatures: any[] = []
      const existingFeaturesIndex = {}

      delegate.add(existingFeatures, existingFeaturesIndex, 'good_feature')

      expect(existingFeatures).toStrictEqual([{ name: 'good_feature', variant: null }])
      expect(existingFeaturesIndex).toStrictEqual({ good_feature: 0 })
    })

    it('should add a feature flag with only a name if variant is null', () => {
      const existingFeatures: [] = []
      const existingFeaturesIndex = {}

      delegate.add(existingFeatures, existingFeaturesIndex, 'ok_feature', null)

      expect(existingFeatures).toStrictEqual([{ name: 'ok_feature', variant: null }])
      expect(existingFeaturesIndex).toStrictEqual({ ok_feature: 0 })
    })

    it('should add a feature flag with a variant', () => {
      const existingFeatures: any[] = []
      const existingFeaturesIndex = {}

      delegate.add(existingFeatures, existingFeaturesIndex, 'cool_feature', 'very ant')

      expect(existingFeatures).toStrictEqual([{ name: 'cool_feature', variant: 'very ant' }])
      expect(existingFeaturesIndex).toStrictEqual({ cool_feature: 0 })
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
      const existingFeatures: any[] = []
      const existingFeaturesIndex = {}

      delegate.add(existingFeatures, existingFeaturesIndex, 'some_feature', variant)

      expect(existingFeatures).toStrictEqual([{ name: 'some_feature', variant: expected }])
      expect(existingFeaturesIndex).toStrictEqual({ some_feature: 0 })
    })

    it('should overwrite an existing flag if the name already exists', () => {
      const existingFeatures = [{ name: 'a', variant: 'a' }, { name: 'b', variant: 'b' }, { name: 'c', variant: 'c' }, { name: 'd', variant: 'd' }, { name: 'e', variant: 'e' }]
      const existingFeaturesIndex = { a: 0, b: 1, c: 2, d: 3, e: 4 }

      delegate.add(existingFeatures, existingFeaturesIndex, 'b', 'x')
      delegate.add(existingFeatures, existingFeaturesIndex, 'e', 'y')
      delegate.add(existingFeatures, existingFeaturesIndex, 'a', 'z')

      expect(existingFeatures).toStrictEqual([{ name: 'a', variant: 'z' }, { name: 'b', variant: 'x' }, { name: 'c', variant: 'c' }, { name: 'd', variant: 'd' }, { name: 'e', variant: 'y' }])
      expect(existingFeaturesIndex).toStrictEqual({ a: 0, b: 1, c: 2, d: 3, e: 4 })
    })
  })

  describe('#merge', () => {
    it('should set feature flags when there are no existing flags', () => {
      const existingFeatures: any[] = []
      const existingFeaturesIndex = {}

      delegate.merge(existingFeatures, [
        { name: 'a', variant: 'b' },
        { name: 'c', variant: 'd' }
      ], existingFeaturesIndex)

      expect(existingFeatures).toStrictEqual([{ name: 'a', variant: 'b' }, { name: 'c', variant: 'd' }])
      expect(existingFeaturesIndex).toStrictEqual({ a: 0, c: 1 })
    })

    it('should merge feature flags with existing flags', () => {
      const existingFeatures = [{ name: 'a', variant: 'a' }, { name: 'b', variant: 'b' }, { name: 'c', variant: 'c' }, { name: 'd', variant: 'd' }, { name: 'e', variant: 'e' }]
      const existingFeaturesIndex = { a: 0, b: 1, c: 2, d: 3, e: 4 }

      delegate.merge(existingFeatures, [
        { name: 'b', variant: 'x' },
        { name: 'e', variant: 'y' },
        { name: 'a', variant: 'z' }
      ], existingFeaturesIndex)

      expect(existingFeatures).toStrictEqual([{ name: 'a', variant: 'z' }, { name: 'b', variant: 'x' }, { name: 'c', variant: 'c' }, { name: 'd', variant: 'd' }, { name: 'e', variant: 'y' }])
      expect(existingFeaturesIndex).toStrictEqual({ a: 0, b: 1, c: 2, d: 3, e: 4 })
    })

    it('should handle non-string variants', () => {
      const existingFeaturesIndex = { a: 0, b: 1, c: 2, d: 3, e: 4, f: 5, g: 6, h: 7, i: 8, j: 9, k: 10, l: 11, m: 12, n: 13, o: 14, p: 15 }
      const existingFeatures = [
        { name: 'a', variant: 'a' },
        { name: 'b', variant: 'b' },
        { name: 'c', variant: 'c' },
        { name: 'd', variant: 'd' },
        { name: 'e', variant: 'e' },
        { name: 'f', variant: 'f' },
        { name: 'g', variant: 'g' },
        { name: 'h', variant: 'h' },
        { name: 'i', variant: 'i' },
        { name: 'j', variant: 'j' },
        { name: 'k', variant: 'k' },
        { name: 'l', variant: 'l' },
        { name: 'm', variant: 'm' },
        { name: 'n', variant: 'n' },
        { name: 'o', variant: 'o' },
        { name: 'p', variant: 'p' }
      ]

      delegate.merge(existingFeatures, [
        { name: 'a', variant: 12345 },
        { name: 'c', variant: 0 },
        { name: 'e', variant: true },
        { name: 'g', variant: false },
        { name: 'i', variant: [1, 2, 3] },
        { name: 'k', variant: [] },
        { name: 'm', variant: { a: 1, b: 2, c: { d: 3 } } },
        { name: 'o', variant: { abc: 123, toString () { throw new Error('nope') } } }
      ], existingFeaturesIndex)

      expect(existingFeatures).toStrictEqual([
        { name: 'a', variant: '12345' },
        { name: 'b', variant: 'b' },
        { name: 'c', variant: '0' },
        { name: 'd', variant: 'd' },
        { name: 'e', variant: 'true' },
        { name: 'f', variant: 'f' },
        { name: 'g', variant: 'false' },
        { name: 'h', variant: 'h' },
        { name: 'i', variant: '[1,2,3]' },
        { name: 'j', variant: 'j' },
        { name: 'k', variant: '[]' },
        { name: 'l', variant: 'l' },
        { name: 'm', variant: '{"a":1,"b":2,"c":{"d":3}}' },
        { name: 'n', variant: 'n' },
        { name: 'o', variant: '{"abc":123}' },
        { name: 'p', variant: 'p' }
      ])

      expect(existingFeaturesIndex).toStrictEqual(
        { a: 0, b: 1, c: 2, d: 3, e: 4, f: 5, g: 6, h: 7, i: 8, j: 9, k: 10, l: 11, m: 12, n: 13, o: 14, p: 15 }

      )
    })

    it('should ignore feature flags with invalid/missing names', () => {
      const existingFeatures = [{ name: 'a', variant: 'a' }, { name: 'b', variant: 'b' }, { name: 'c', variant: 'c' }, { name: 'd', variant: 'd' }, { name: 'e', variant: 'e' }]
      const existingFeaturesIndex = { a: 0, b: 1, c: 2, d: 3, e: 3 }

      delegate.merge(existingFeatures, [
        { name: 'b', variant: 'x' },
        { variant: 'y' },
        { name: 'a', variant: 'z' },
        { name: [1, 2, 3], variant: 'zzz' },
        { name: 1234, variant: 'oooo' },
        { name: { a: 1 }, variant: 'oooo' }
      ], existingFeaturesIndex)

      expect(existingFeatures).toStrictEqual([{ name: 'a', variant: 'z' }, { name: 'b', variant: 'x' }, { name: 'c', variant: 'c' }, { name: 'd', variant: 'd' }, { name: 'e', variant: 'e' }])
      expect(existingFeaturesIndex).toStrictEqual({ a: 0, b: 1, c: 2, d: 3, e: 3 })
    })

    it('should do nothing if not given an array of features', () => {
      const existingFeatures = [{ name: 'a', variant: 'a' }, { name: 'b', variant: 'b' }, { name: 'c', variant: 'c' }, { name: 'd', variant: 'd' }, { name: 'e', variant: 'e' }]
      const existingFeaturesIndex = { a: 'a', b: 'b', c: 'c', d: 'd', e: 'e' }

      delegate.merge(existingFeatures, { a: 'a', b: 'b', c: 'c' }, existingFeaturesIndex)

      expect(existingFeatures).toStrictEqual([{ name: 'a', variant: 'a' }, { name: 'b', variant: 'b' }, { name: 'c', variant: 'c' }, { name: 'd', variant: 'd' }, { name: 'e', variant: 'e' }])
      expect(existingFeaturesIndex).toStrictEqual({ a: 'a', b: 'b', c: 'c', d: 'd', e: 'e' })
    })

    it('should skip feature flags that are not objects', () => {
      const features = [{ name: 'a', variant: 'a' }, { name: 'b', variant: 'b' }, { name: 'c', variant: 'c' }, { name: 'd', variant: 'd' }, { name: 'e', variant: 'e' }]
      const featuresIndex = { a: 0, b: 1, c: 2, d: 3, e: 4 }

      delegate.merge(features, [
        { name: 'b', variant: 'x' },
        'name: yes',
        undefined,
        { name: 'a', variant: 'z' },
        null,
        1234,
        { name: 'e', variant: 'oooo' }
      ], featuresIndex)

      expect(features).toStrictEqual([{ name: 'a', variant: 'z' }, { name: 'b', variant: 'x' }, { name: 'c', variant: 'c' }, { name: 'd', variant: 'd' }, { name: 'e', variant: 'oooo' }])
      expect(featuresIndex).toStrictEqual({ a: 0, b: 1, c: 2, d: 3, e: 4 })
    })
  })

  describe('#toEventApi', () => {
    it('should convert a map into the event API format', () => {
      const features: any[] = []
      const featuresIndex = {}

      delegate.add(features, featuresIndex, 'a', 'b')
      delegate.merge(features, [
        { name: 'c', variant: 'd' },
        { name: 'e' },
        { name: 'f', variant: 'g' }
      ], featuresIndex)

      expect(features).toStrictEqual([{ name: 'a', variant: 'b' }, { name: 'c', variant: 'd' }, { name: 'e', variant: null }, { name: 'f', variant: 'g' }])

      expect(delegate.toEventApi(features)).toStrictEqual([
        { featureFlag: 'a', variant: 'b' },
        { featureFlag: 'c', variant: 'd' },
        { featureFlag: 'e' },
        { featureFlag: 'f', variant: 'g' }
      ])
    })

    it('should handle an empty array', () => {
      expect(delegate.toEventApi([])).toStrictEqual([])
    })
  })
})
