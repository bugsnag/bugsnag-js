const { describe, it, expect } = global

const ensureError = require('../ensure-error')

describe('ensureError(maybeErr)', () => {
  it('works with errors', () => {
    const maybeErr = new Error('jim')
    const { actualError, metadata } = ensureError(maybeErr)
    expect(actualError).toBe(maybeErr)
    expect(metadata).toBe(undefined)
  })

  it('tolerates null', () => {
    const { actualError, metadata } = ensureError(null)
    expect(actualError.message).toBe('Handled a non-error. See "error" tab for more detail.')
    expect(metadata['non-error value']).toBe('null')
  })
})
