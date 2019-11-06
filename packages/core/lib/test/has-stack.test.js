const { describe, it, expect } = global

const hasStack = require('../has-stack')

describe('hasStack(err)', () => {
  it('works with all kinds of input', () => {
    expect(hasStack(new Error('sdf'))).toBe(true)
    expect(hasStack(null)).toBe(false)
    expect(hasStack({ stacktrace: 'Error: uncaught TypeError at:\nfoo@index.js:34:34' })).toBe(true)
    expect(hasStack({ 'opera#sourceloc': 'Error: uncaught TypeError at:\nfoo@index.js:34:34' })).toBe(true)
  })
})
