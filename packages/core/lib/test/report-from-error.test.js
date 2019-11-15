const { describe, it, expect } = global

const createEventFromErr = require('../event-from-error')

describe('createEventFromErr(maybeErr)', () => {
  it('works with errors', () => {
    const event = createEventFromErr(new Error('jim'))
    expect(event.errorMessage).toBe('jim')
  })

  it('tolerates null', () => {
    const event = createEventFromErr(null)
    expect(event.errorMessage).toBe('Handled a non-error. See "error" tab for more detail.')
    expect(event.metaData.error['non-error value']).toBe('null')
  })

  it('accepts acustom handledState', () => {
    const event = createEventFromErr(new Error('floop'), {
      unhandled: true,
      severity: 'info',
      severityReason: { type: 'userCallbackSetSeverity' }
    })
    expect(event.errorMessage).toBe('floop')
    expect(event._handledState.unhandled).toBe(true)
  })
})
