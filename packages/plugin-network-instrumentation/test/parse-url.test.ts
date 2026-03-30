import parseUrl from '../lib/parse-url'

describe('parseUrl', () => {
  it('should extract domain, clean URL, and query string from absolute URL', () => {
    const url = 'https://api.example.com/path?token=abc123&user=john'
    const result = parseUrl(url)

    expect(result.domain).toBe('api.example.com')
    expect(result.cleanUrl).toBe('https://api.example.com/path')
    expect(result.queryString).toBe('token=abc123&user=john')
  })

  it('should handle URLs without query strings', () => {
    const url = 'https://example.com/path'
    const result = parseUrl(url)

    expect(result.domain).toBe('example.com')
    expect(result.cleanUrl).toBe('https://example.com/path')
    expect(result.queryString).toBe('')
  })

  it('should preserve hash fragments', () => {
    const url = 'https://example.com/path?key=value#section'
    const result = parseUrl(url)

    expect(result.domain).toBe('example.com')
    expect(result.cleanUrl).toBe('https://example.com/path#section')
    expect(result.queryString).toBe('key=value')
  })

  it('should handle hash without query string', () => {
    const url = 'https://example.com/path#section'
    const result = parseUrl(url)

    expect(result.domain).toBe('example.com')
    expect(result.cleanUrl).toBe('https://example.com/path#section')
    expect(result.queryString).toBe('')
  })

  it('should preserve encoded URI components in query string', () => {
    const url = 'https://example.com?email=test%40example.com&name=John%20Doe'
    const result = parseUrl(url)

    expect(result.domain).toBe('example.com')
    expect(result.queryString).toBe('email=test%40example.com&name=John%20Doe')
  })

  it('should handle empty query parameter values', () => {
    const url = 'https://example.com?flag&value=test'
    const result = parseUrl(url)

    expect(result.domain).toBe('example.com')
    expect(result.queryString).toBe('flag&value=test')
  })

  it('should handle multiple slashes in path', () => {
    const url = 'https://example.com/api/v1/users/profile?id=123'
    const result = parseUrl(url)

    expect(result.domain).toBe('example.com')
    expect(result.cleanUrl).toBe('https://example.com/api/v1/users/profile')
    expect(result.queryString).toBe('id=123')
  })

  it('should handle ports in domain', () => {
    const url = 'https://example.com:8080/path?query=value'
    const result = parseUrl(url)

    expect(result.domain).toBe('example.com:8080')
    expect(result.cleanUrl).toBe('https://example.com:8080/path')
    expect(result.queryString).toBe('query=value')
  })

  it('should return unknown domain for relative URLs', () => {
    const url = '/api/endpoint?param=value'
    const result = parseUrl(url)

    expect(result.domain).toBe('unknown')
    expect(result.cleanUrl).toBe('/api/endpoint')
    expect(result.queryString).toBe('param=value')
  })

  it('should handle http protocol', () => {
    const url = 'http://example.com/path?key=value'
    const result = parseUrl(url)

    expect(result.domain).toBe('example.com')
    expect(result.cleanUrl).toBe('http://example.com/path')
    expect(result.queryString).toBe('key=value')
  })

  it('should be case-insensitive for protocol matching', () => {
    const url = 'HTTPS://example.com/path?key=value'
    const result = parseUrl(url)

    expect(result.domain).toBe('example.com')
    expect(result.cleanUrl).toBe('HTTPS://example.com/path')
    expect(result.queryString).toBe('key=value')
  })

  it('should handle special characters in query string', () => {
    const url = 'https://example.com?data={"key":"value"}&text=hello%20world'
    const result = parseUrl(url)

    expect(result.domain).toBe('example.com')
    expect(result.queryString).toBe('data={"key":"value"}&text=hello%20world')
  })

  it('should handle malformed query strings', () => {
    const url = 'https://example.com/path?key=value&&&another=test'
    const result = parseUrl(url)

    expect(result.domain).toBe('example.com')
    expect(result.cleanUrl).toBe('https://example.com/path')
    expect(result.queryString).toBe('key=value&&&another=test')
  })
})
