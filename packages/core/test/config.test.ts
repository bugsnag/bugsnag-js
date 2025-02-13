import schema from '../src/config'

describe('config', () => {
  describe('schema', () => {
    it('has the required properties { validate(), defaultValue(), message }', () => {
      Object.keys(schema).forEach(k => {
        const key = k as unknown as keyof typeof schema
        schema[key].defaultValue(undefined)
        // @ts-expect-error testing invalid arguments
        schema[key].validate()
        schema[key].validate(-1)
        schema[key].validate('stringy stringerson')
        schema[key].validate(['foo', 'bar', 'baz'])
        schema[key].validate(new Date())
        schema[key].validate(null)
        expect(typeof schema[key].message).toBe('string')
      })
    })
  })

  describe('user', () => {
    it('should only allow id, name and email', () => {
      const userValidator = schema.user.validate
      expect(userValidator(null)).toBe(true)
      expect(userValidator({ id: '123', email: 'bug@sn.ag', name: 'Bugsnag' })).toBe(true)
      expect(userValidator({ id: '123', email: 'bug@sn.ag', name: 'Bugsnag', extra: 'aaa' })).toBe(false)
      expect(userValidator({ id: '123' })).toBe(true)
      expect(userValidator('123')).toBe(false)
    })
  })

  describe('enabledBreadcrumbTypes', () => {
    it('fails when a supplied value is not a valid breadcrumb type', () => {
      const enabledBreadcrumbTypesValidator = schema.enabledBreadcrumbTypes.validate
      expect(enabledBreadcrumbTypesValidator(['UNKNOWN_BREADCRUMB_TYPE'])).toBe(false)
    })
  })

  describe('enabledErrorTypes', () => {
    it('is ok with an empty object', () => {
      const enabledErrorTypesValidator = schema.enabledErrorTypes.validate
      expect(enabledErrorTypesValidator({})).toBe(true)
    })

    it('works with a subset of error types', () => {
      const enabledErrorTypesValidator = schema.enabledErrorTypes.validate
      expect(enabledErrorTypesValidator({ unhandledExceptions: true })).toBe(true)
    })

    it('fails when an additional unsupported type is provided', () => {
      const enabledErrorTypesValidator = schema.enabledErrorTypes.validate
      expect(enabledErrorTypesValidator({
        unhandledExceptions: true,
        unhandledRejections: false,
        unwantedDistractions: true
      })).toBe(false)
    })
  })

  describe('featureFlags', () => {
    it.each([
      undefined,
      null,
      1234,
      'hello',
      { name: 'example' },
      { length: 1000 }
    ])('fails when the supplied value is not an array (%p)', value => {
      const validator = schema.featureFlags.validate

      expect(validator(value)).toBe(false)
    })

    it('fails when a value does not have a "name"', () => {
      const validator = schema.featureFlags.validate

      expect(validator([{ name: 'hello' }, { notName: 'oops' }])).toBe(false)
    })

    it('passes when all values have a "name"', () => {
      const validator = schema.featureFlags.validate
      const featureFlags = [
        { name: 'hello' },
        { name: 'abc', variant: 'xyz' },
        { name: 'hi' }
      ]

      expect(validator(featureFlags)).toBe(true)
    })
  })
})
