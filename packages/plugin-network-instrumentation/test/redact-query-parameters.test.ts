import redactQueryParameters from '../lib/redact-query-parameters'

describe('redact-query-parameters', () => {
  it('redacts specified query parameters in a URL', () => {
    const url = 'http://example.com/path?token=abc123&userId=42&status=active'
    const redactedKeys = ['token', 'userId']
    const redactedUrl = redactQueryParameters(url, redactedKeys)
    expect(redactedUrl).toBe('http://example.com/path?token=[REDACTED]&userId=[REDACTED]&status=active')
  })

  it('handles URLs with no query parameters', () => {
    const url = 'http://example.com/path'
    const redactedKeys = ['token']
    const redactedUrl = redactQueryParameters(url, redactedKeys)
    expect(redactedUrl).toBe('http://example.com/path')
  })

  it('handles relative URLs', () => {
    const url = '/path?token=abc123&userId=42'
    const redactedKeys = ['token', 'userId']
    const redactedUrl = redactQueryParameters(url, redactedKeys)
    expect(redactedUrl).toBe('/path?token=[REDACTED]&userId=[REDACTED]')
  })
})
