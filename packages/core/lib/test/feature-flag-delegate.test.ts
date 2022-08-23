import delegate from '../feature-flag-delegate'

interface Feature {
  name: string
  variant: string | null
}

describe.skip('feature flag delegate', () => {
  describe('#add', () => {
    it('should do nothing if name is not passed', () => {
      const existingFeatures = [{ name: 'abc', variant: 'xyz' }]

      delegate.add(existingFeatures)

      expect(existingFeatures).toStrictEqual([{ name: 'abc', variant: 'xyz' }])
    })

    it('should do nothing if name is undefined but variant is passed', () => {
      const existingFeatures = [{ name: 'abc', variant: 'xyz' }]

      delegate.add(existingFeatures, undefined, '???')

      expect(existingFeatures).toStrictEqual([{ name: 'abc', variant: 'xyz' }])
    })

    it('should do nothing if name is null but variant is passed', () => {
      const existingFeatures = [{ name: 'abc', variant: 'xyz' }]

      delegate.add(existingFeatures, null, '???')

      expect(existingFeatures).toStrictEqual([{ name: 'abc', variant: 'xyz' }])
    })

    it('should add a feature flag with only a name if variant is undefined', () => {
      const existingFeatures: Feature[] = []

      delegate.add(existingFeatures, 'good_feature')

      expect(existingFeatures).toStrictEqual([{ name: 'good_feature', variant: null }])
    })

    it('should add a feature flag with only a name if variant is null', () => {
      const existingFeatures: Feature[] = []

      delegate.add(existingFeatures, 'ok_feature', null)

      expect(existingFeatures).toStrictEqual([{ name: 'ok_feature', variant: null }])
    })

    it('should add a feature flag with a variant', () => {
      const existingFeatures: Feature[] = []

      delegate.add(existingFeatures, 'cool_feature', 'very ant')

      expect(existingFeatures).toStrictEqual([{ name: 'cool_feature', variant: 'very ant' }])
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
      const existingFeatures: Feature[] = []

      delegate.add(existingFeatures, 'some_feature', variant)

      expect(existingFeatures).toStrictEqual([{ name: 'some_feature', variant: expected }])
    })

    it('should overwrite an existing flag if the name already exists', () => {
      const existingFeatures = [{ name: 'a', variant: 'a' }, { name: 'b', variant: 'b' }, { name: 'c', variant: 'c' }, { name: 'd', variant: 'd' }, { name: 'e', variant: 'e' }]

      delegate.add(existingFeatures, 'b', 'x')
      delegate.add(existingFeatures, 'e', 'y')
      delegate.add(existingFeatures, 'a', 'z')

      expect(existingFeatures).toStrictEqual([{ name: 'a', variant: 'z' }, { name: 'b', variant: 'x' }, { name: 'c', variant: 'c' }, { name: 'd', variant: 'd' }, { name: 'e', variant: 'y' }])
    })
  })

  describe('#merge', () => {
    it('should set feature flags when there are no existing flags', () => {
      const existingFeatures: Feature[] = []

      delegate.merge(existingFeatures, [
        { name: 'a', variant: 'b' },
        { name: 'c', variant: 'd' }
      ])

      expect(existingFeatures).toStrictEqual([{ name: 'a', variant: 'b' }, { name: 'c', variant: 'd' }])
    })

    it('should merge feature flags with existing flags', () => {
      const existingFeatures = [{ name: 'a', variant: 'a' }, { name: 'b', variant: 'b' }, { name: 'c', variant: 'c' }, { name: 'd', variant: 'd' }, { name: 'e', variant: 'e' }]

      delegate.merge(existingFeatures, [
        { name: 'b', variant: 'x' },
        { name: 'e', variant: 'y' },
        { name: 'a', variant: 'z' }
      ])

      expect(existingFeatures).toStrictEqual([{ name: 'a', variant: 'z' }, { name: 'b', variant: 'x' }, { name: 'c', variant: 'c' }, { name: 'd', variant: 'd' }, { name: 'e', variant: 'y' }])
    })

    it('should handle non-string variants', () => {
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
      ])

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
    })

    it('should ignore feature flags with invalid/missing names', () => {
      const existingFeatures = [{ name: 'a', variant: 'a' }, { name: 'b', variant: 'b' }, { name: 'c', variant: 'c' }, { name: 'd', variant: 'd' }, { name: 'e', variant: 'e' }]

      delegate.merge(existingFeatures, [
        { name: 'b', variant: 'x' },
        { variant: 'y' },
        { name: 'a', variant: 'z' },
        { name: [1, 2, 3], variant: 'zzz' },
        { name: 1234, variant: 'oooo' },
        { name: { a: 1 }, variant: 'oooo' }
      ])

      expect(existingFeatures).toStrictEqual([{ name: 'a', variant: 'z' }, { name: 'b', variant: 'x' }, { name: 'c', variant: 'c' }, { name: 'd', variant: 'd' }, { name: 'e', variant: 'e' }])
    })

    it('should do nothing if not given an array of features', () => {
      const existingFeatures = [{ name: 'a', variant: 'a' }, { name: 'b', variant: 'b' }, { name: 'c', variant: 'c' }, { name: 'd', variant: 'd' }, { name: 'e', variant: 'e' }]

      delegate.merge(existingFeatures, { a: 'a', b: 'b', c: 'c' })

      expect(existingFeatures).toStrictEqual([{ name: 'a', variant: 'a' }, { name: 'b', variant: 'b' }, { name: 'c', variant: 'c' }, { name: 'd', variant: 'd' }, { name: 'e', variant: 'e' }])
    })

    it('should skip feature flags that are not objects', () => {
      const existingFeatures = [{ name: 'a', variant: 'a' }, { name: 'b', variant: 'b' }, { name: 'c', variant: 'c' }, { name: 'd', variant: 'd' }, { name: 'e', variant: 'e' }]

      delegate.merge(existingFeatures, [
        { name: 'b', variant: 'x' },
        'name: yes',
        undefined,
        { name: 'a', variant: 'z' },
        null,
        1234,
        { name: 'e', variant: 'oooo' }
      ])

      expect(existingFeatures).toStrictEqual([{ name: 'a', variant: 'z' }, { name: 'b', variant: 'x' }, { name: 'c', variant: 'c' }, { name: 'd', variant: 'd' }, { name: 'e', variant: 'oooo' }])
    })
  })

  describe('#toEventApi', () => {
    it('should convert a map into the event API format', () => {
      const features: Feature[] = []

      delegate.add(features, 'a', 'b')
      delegate.merge(features, [
        { name: 'c', variant: 'd' },
        { name: 'e' },
        { name: 'f', variant: 'g' }
      ])

      expect(features).toStrictEqual([{ name: 'a', variant: 'b' }, { name: 'c', variant: 'd' }, { name: 'e', variant: null }, { name: 'f', variant: 'g' }])

      expect(delegate.toEventApi(features)).toStrictEqual([
        { featureFlag: 'a', variant: 'b' },
        { featureFlag: 'c', variant: 'd' },
        { featureFlag: 'e' },
        { featureFlag: 'f', variant: 'g' }
      ])
    })

    it('should handle an empty array', () => {
      const features: Feature[] = []
      expect(delegate.toEventApi(features)).toStrictEqual([])
    })

    it('should preseve the order features are added', () => {
      const features = [{ name: '1', variant: 'first' }]
      delegate.add(features, '5', 'second')
      delegate.add(features, '2')
      delegate.add(features, 'feature', 'fourth')
      const events = delegate.toEventApi(features)
      expect(events).toHaveLength(4)
      expect(events).toStrictEqual([
        { featureFlag: '1', variant: 'first' },
        { featureFlag: '5', variant: 'second' },
        { featureFlag: '2' },
        { featureFlag: 'feature', variant: 'fourth' }
      ])
    })
  })
})
