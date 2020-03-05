import config from '../config'

describe('@bugsnag/core/config', () => {
  describe('schema', () => {
    it('has the required properties { validate(), defaultValue(), message }', () => {
      Object.keys(config.schema).forEach(k => {
        const key = k as unknown as keyof typeof config.schema
        config.schema[key].defaultValue(undefined)
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

  describe('enabledBreadcrumbTypes', () => {
    it('fails when a supplied value is not a valid breadcrumb type', () => {
      const enabledBreadcrumbTypesValidator = config.schema.enabledBreadcrumbTypes.validate
      expect(enabledBreadcrumbTypesValidator(['UNKNOWN_BREADCRUMB_TYPE'])).toBe(false)
    })
  })
})
