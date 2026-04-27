import parseQueryString from '../src/lib/parse-query-string'

describe('parseQueryString', () => {
  it('should parse a query string into an object', () => {
    const queryString = 'token=abc123&user=john&active=true'
    const result = parseQueryString(queryString)

    expect(result).toEqual({
      token: 'abc123',
      user: 'john',
      active: 'true'
    })
  })

  it('should handle empty query string', () => {
    const result = parseQueryString('')

    expect(result).toEqual({})
  })

  it('should handle null/undefined gracefully', () => {
    // @ts-expect-error intentionally passing null to test graceful handling
    expect(parseQueryString(null)).toEqual({})
    // @ts-expect-error intentionally passing undefined to test graceful handling
    expect(parseQueryString(undefined)).toEqual({})
  })

  it('should decode URI components', () => {
    const queryString = 'email=test%40example.com&name=John%20Doe&path=%2Fhome%2Fuser'
    const result = parseQueryString(queryString)

    expect(result).toEqual({
      email: 'test@example.com',
      name: 'John Doe',
      path: '/home/user'
    })
  })

  it('should handle empty parameter values', () => {
    const queryString = 'flag&value=test&empty='
    const result = parseQueryString(queryString)

    expect(result).toEqual({
      flag: '',
      value: 'test',
      empty: ''
    })
  })

  it('should handle single parameter', () => {
    const queryString = 'id=123'
    const result = parseQueryString(queryString)

    expect(result).toEqual({ id: '123' })
  })

  it('should skip empty pairs', () => {
    const queryString = 'key=value&&&another=test'
    const result = parseQueryString(queryString)

    expect(result).toEqual({
      key: 'value',
      another: 'test'
    })
  })

  it('should preserve special characters in values', () => {
    const queryString = 'data={"key":"value"}&text=hello%20world'
    const result = parseQueryString(queryString)

    expect(result).toEqual({
      data: '{"key":"value"}',
      text: 'hello world'
    })
  })

  it('should handle duplicate parameter names (last one wins)', () => {
    const queryString = 'key=first&key=second&key=third'
    const result = parseQueryString(queryString)

    expect(result).toEqual({
      key: 'third'
    })
  })
})
