import config from '../config'

describe('@bugsnag/core/config', () => {
  describe('schema', () => {
    it('has the required properties { validate(), defaultValue(), message }', () => {
      Object.keys(config.schema).forEach(k => {
        const key = k as unknown as keyof typeof config.schema
        config.schema[key].defaultValue(undefined)
        // @ts-expect-error
        config.schema[key].validate()
        config.schema[key].validate(-1)
        config.schema[key].validate('stringy stringerson')
        config.schema[key].validate(['foo', 'bar', 'baz'])
        config.schema[key].validate(new Date())
        config.schema[key].validate(null)
        expect(typeof config.schema[key].message).toBe('string')
      })
    })
  })

  describe('user', () => {
    it('should only allow id, name and email', () => {
      const userValidator = config.schema.user.validate
      expect(userValidator(null)).toBe(true)
      expect(userValidator({ id: '123', email: 'bug@sn.ag', name: 'Bugsnag' })).toBe(true)
      expect(userValidator({ id: '123', email: 'bug@sn.ag', name: 'Bugsnag', extra: 'aaa' })).toBe(false)
      expect(userValidator({ id: '123' })).toBe(true)
      expect(userValidator('123')).toBe(false)
    })
  })

  describe('enabledBreadcrumbTypes', () => {
    it('fails when a supplied value is not a valid breadcrumb type', () => {
      const enabledBreadcrumbTypesValidator = config.schema.enabledBreadcrumbTypes.validate
      expect(enabledBreadcrumbTypesValidator(['UNKNOWN_BREADCRUMB_TYPE'])).toBe(false)
    })
  })

  describe('enabledErrorTypes', () => {
    it('is ok with an empty object', () => {
      const enabledErrorTypesValidator = config.schema.enabledErrorTypes.validate
      expect(enabledErrorTypesValidator({})).toBe(true)
    })

    it('works with a subset of error types', () => {
      const enabledErrorTypesValidator = config.schema.enabledErrorTypes.validate
      expect(enabledErrorTypesValidator({ unhandledExceptions: true })).toBe(true)
    })

    it('fails when an additional unsupported type is provided', () => {
      const enabledErrorTypesValidator = config.schema.enabledErrorTypes.validate
      expect(enabledErrorTypesValidator({
        unhandledExceptions: true,
        unhandledRejections: false,
        unwantedDistractions: true
      })).toBe(false)
    })
  })
})
