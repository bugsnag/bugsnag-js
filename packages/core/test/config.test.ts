import config from '../config'

describe('@bugsnag/core/config', () => {
  describe('validate()', () => {
    it('needs opts/schema', () => {
      expect(() => config.validate()).toThrow()
      expect(() => config.validate({})).toThrow()
    })

    it('passes without errors', () => {
      const validity = config.validate({}, { str: { validate: () => true, message: 'never valid' } })
      expect(validity.valid).toBe(true)
      expect(validity.errors[0]).toBe(undefined)
    })

    it('fails with errors', () => {
      const validity = config.validate({}, { str: { validate: () => false, message: 'never valid' } })
      expect(validity.valid).toBe(false)
      expect(validity.errors[0]).toEqual({ key: 'str', message: 'never valid', value: undefined })
    })
  })

  describe('mergeDefaults()', () => {
    it('needs opts/schema', () => {
      expect(() => config.mergeDefaults()).toThrow()
      expect(() => config.mergeDefaults({})).toThrow()
    })

    it('merges correctly', () => {
      const str = 'bugs bugs bugs'
      const a = config.mergeDefaults({}, { str: { defaultValue: () => str } })
      expect(a.str).toBe(str)

      const b = config.mergeDefaults({ str }, { str: { defaultValue: () => 'not bugs' } })
      expect(b.str).toBe(str)

      const c = config.mergeDefaults({ str: '', bool: false }, {
        str: { defaultValue: () => str },
        bool: { defaultValue: () => true }
      })
      expect(c).toEqual({ str: '', bool: false })

      const d = config.mergeDefaults({ str: undefined, bool: undefined }, {
        str: { defaultValue: () => str },
        bool: { defaultValue: () => true }
      })
      expect(d).toEqual({ str: str, bool: true })
    })
  })

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
