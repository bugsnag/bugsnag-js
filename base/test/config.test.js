const { describe, it, expect } = global

const config = require('../config')

describe('base/config', () => {
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
        config.schema[k].defaultValue()
        config.schema[k].validate()
        config.schema[k].validate(-1)
        config.schema[k].validate('stringy stringerson')
        config.schema[k].validate([ 'foo', 'bar', 'baz' ])
        config.schema[k].validate(new Date())
        config.schema[k].validate(null)
        expect(typeof config.schema[k].message).toBe('string')
      })
    })
  })
})
