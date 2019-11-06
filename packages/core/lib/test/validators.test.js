const { describe, it, expect } = global

const { intRange, stringWithLength, arrayOfStrings } = require('../validators')

describe('intRange(min, max)(val)', () => {
  it('work with various values', () => {
    // default min/max: 1 to Infinity
    expect(intRange()(10)).toBe(true)
    expect(intRange()(1e5)).toBe(true)
    for (let i = 1; i <= 1000; i++) expect(intRange()(i)).toBe(true)
    expect(intRange()(-10)).toBe(false)
    expect(intRange()(0)).toBe(false)
    expect(intRange()(1.123)).toBe(false)
    expect(intRange()('')).toBe(false)
    expect(intRange()('100')).toBe(false)

    // custom min/max
    expect(intRange(-10, 20)(11)).toBe(true)
    expect(intRange(-10, 20)(-13)).toBe(false)
    expect(intRange(-10, 20)(20)).toBe(true)
    expect(intRange(-10, 20)(21)).toBe(false)
  })
})

describe('stringWithLength(val)', () => {
  it('should work with various values', () => {
    expect(stringWithLength('hi')).toBe(true)
    expect(stringWithLength('')).toBe(false)
    expect(stringWithLength(null)).toBe(false)
    expect(stringWithLength(undefined)).toBe(false)
    expect(stringWithLength(10)).toBe(false)
    expect(stringWithLength([])).toBe(false)
  })
})

describe('arrayOfStrings(val)', () => {
  it('should work with various values', () => {
    expect(arrayOfStrings(['hi'])).toBe(true)
    expect(arrayOfStrings('')).toBe(false)
    expect(arrayOfStrings(null)).toBe(true)
    expect(arrayOfStrings(undefined)).toBe(false)
    expect(arrayOfStrings(['hi', 1])).toBe(false)
    expect(arrayOfStrings([])).toBe(true)
  })
})
