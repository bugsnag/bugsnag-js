import derecursift from '../derecursify'

describe('delivery: react native makeSafe', () => {
  it('leaves simple types intact', () => {
    const symbol = Symbol('symbol_field')
    const date = new Date()
    const data: any = {
      string: 'hello',
      number: -15.321,
      bool: true,
      date,
      array: [
        1, 2, 3,
        'string',
        { nestedObject: true }
      ],
      nestedData: {
        string: 'hello',
        number: -15.321,
        bool: true
      },
      [symbol]: 'some value',
      map: new Map([['key', 'value']]),
      _null: null,
      _undefined: undefined
    }

    const result = derecursift(data)

    /* eslint-disable-next-line @typescript-eslint/no-dynamic-delete */
    delete data[symbol] // we don't copy Symbol keys over
    expect(result).toStrictEqual({
      ...data,
      // dates are converted to ISO strings
      date: date.toISOString(),
      // maps iterate as arrays of arrays
      map: [
        ['key', 'value']
      ]
    })
  })

  describe('handles errors', () => {
    it('when reading properties', () => {
      const object: any = {}
      Object.defineProperty(object, 'badProperty', {
        get () {
          throw new Error('failure')
        },
        enumerable: true
      })

      const result = derecursift(object)
      expect(result).toStrictEqual({ badProperty: '[Throws: failure]' })
    })

    it('when they are properties', () => {
      const value = { errorProp: new Error('something wrong') }
      const result = derecursift(value)
      expect(result).toStrictEqual({ errorProp: { name: 'Error', message: 'something wrong' } })
    })
  })

  describe('handles circular references', () => {
    it('when directly in objects', () => {
      const object: { self?: any } = {}
      object.self = object

      const result = derecursift(object)
      expect(result).toStrictEqual({ self: '[Circular]' })
    })

    it('when nested in objects', () => {
      const outer: any = {
        inner: {}
      }

      outer.inner.parent = outer

      const result = derecursift(outer)
      expect(result).toStrictEqual({ inner: { parent: '[Circular]' } })
    })

    it('when in arrays', () => {
      const array: any[] = [{}, {}]
      array[0].circularRef = array

      const result = derecursift(array)
      expect(result).toStrictEqual([{ circularRef: '[Circular]' }, {}])
    })

    it('when in non-array iterables', () => {
      const object: any = {}
      const values = new Set()
      values.add(object)

      object.container = values

      const result = derecursift(values)
      expect(result).toStrictEqual([{ container: '[Circular]' }])
    })

    it('when nested in objects within arrays', () => {
      const metaData: any = {
        from: 'javascript'
      }

      // ensure that circular references are safely handled
      metaData.circle = metaData

      const array = [{
        someObject: metaData
      }]

      const result = derecursift(array)
      expect(result).toStrictEqual([
        {
          someObject: {
            from: 'javascript',
            circle: '[Circular]'
          }
        }
      ])
    })
  })
})
