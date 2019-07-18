const { describe, it, expect } = global

const createReportFromErr = require('../report-from-error')

describe('createReportFromErr(maybeErr)', () => {
  it('works with errors', () => {
    const report = createReportFromErr(new Error('jim'))
    expect(report.toJSON().exceptions[0].message).toBe('jim')
  })

  it('tolerates null', () => {
    const report = createReportFromErr(null)
    expect(report.toJSON().exceptions[0].message).toBe('Handled a non-error. See "error" tab for more detail.')
    expect(report.toJSON().metaData.error['non-error value']).toBe('null')
  })

  it('accepts acustom handledState', () => {
    const report = createReportFromErr(new Error('floop'), {
      unhandled: true,
      severity: 'info',
      severityReason: { type: 'userCallbackSetSeverity' }
    })
    expect(report.toJSON().exceptions[0].message).toBe('floop')
    expect(report.toJSON().unhandled).toBe(true)
  })
})
