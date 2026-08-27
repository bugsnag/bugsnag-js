import * as configModule from '../src/config'

const schema = configModule.schema || (configModule.default as any)?.schema || configModule.default

describe('config', () => {
  describe('schema', () => {
    it('has the required properties { validate(), defaultValue(), message }', () => {
      expect(schema).toBeDefined()
      Object.keys(schema).forEach(keyName => {
        const key = keyName as keyof typeof schema
        const validator = schema[key]

        if (validator && typeof validator === 'object') {
          if (typeof validator.defaultValue === 'function') {
            validator.defaultValue(undefined)
          }
          if (typeof validator.validate === 'function') {
            validator.validate()
            validator.validate(-1)
            validator.validate('stringy stringerson')
            validator.validate(['foo', 'bar', 'baz'])
            validator.validate(new Date())
            validator.validate(null)
          }
          if (validator.message) {
            expect(typeof validator.message).toBe('string')
          }
        }
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