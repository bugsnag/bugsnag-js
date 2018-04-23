const { describe, it, expect } = global

const { positiveIntIfDefined, stringWithLength } = require('../validators')

describe('positiveIntIfDefined(val)', () => {
  it('work with various values', () => {
    expect(positiveIntIfDefined(10)).toBe(true)
    expect(positiveIntIfDefined(1e5)).toBe(true)
    for (let i = 1; i <= 1000; i++) expect(positiveIntIfDefined(i)).toBe(true)
    expect(positiveIntIfDefined(-10)).toBe(false)
    expect(positiveIntIfDefined(0)).toBe(false)
    expect(positiveIntIfDefined(1.123)).toBe(false)
    expect(positiveIntIfDefined('')).toBe(false)
    expect(positiveIntIfDefined('100')).toBe(false)
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
