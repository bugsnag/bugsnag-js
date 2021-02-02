import extractObject from '../extract-object'

describe('extractObject', () => {
  it('returns undefined if the key is not an object, or the value otherwise', () => {
    expect(extractObject({}, 'key')).toBe(undefined)
    expect(extractObject({ key: 'string' }, 'key')).toBe(undefined)
    expect(extractObject({ key: { some: 'value' } }, 'key')).toStrictEqual({ some: 'value' })
  })
})
