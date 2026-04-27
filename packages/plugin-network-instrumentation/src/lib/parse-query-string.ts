/**
 * Parse a query string into an object
 * @param queryString - Query string (e.g., "key=value&foo=bar")
 * @returns Parsed query parameters as key-value pairs
 */
export default function parseQueryString(queryString: string): Record<string, string> {
  const params: Record<string, string> = {}
  if (!queryString) {
    return params
  }

  const pairs = queryString.split('&').filter(pair => pair.length > 0)
  pairs.forEach(pair => {
    const [key, value] = pair.split('=')
    params[decodeURIComponent(key)] = decodeURIComponent(value || '')
  })

  return params
}