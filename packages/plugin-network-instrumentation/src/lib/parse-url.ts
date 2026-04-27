/**
 * Parse a URL in a single pass to extract domain, clean URL, and query string
 * @param url - URL string
 * @returns Object with domain, cleanUrl, and queryString
 */
export default function parseUrl(url: string): { domain: string, cleanUrl: string, queryString: string } {
  try {
    const isAbsolute = /^https?:\/\//i.test(url)

    // Extract query string from the full URL
    const queryStart = url.indexOf('?')
    const hashStart = url.indexOf('#')

    let queryString = ''
    if (queryStart !== -1) {
      const queryEnd = hashStart !== -1 && hashStart > queryStart ? hashStart : url.length
      queryString = url.substring(queryStart + 1, queryEnd)
    }

    // Extract domain
    let domain = 'unknown'
    if (isAbsolute) {
      const urlWithoutProtocol = url.replace(/^https?:\/\//i, '')

      // Find the earliest occurrence of '/', '?', or '#' to determine the domain boundary
      const slashIndex = urlWithoutProtocol.indexOf('/')
      const domainQueryIndex = urlWithoutProtocol.indexOf('?')
      const domainHashIndex = urlWithoutProtocol.indexOf('#')
      let endIndex = urlWithoutProtocol.length
      if (slashIndex !== -1 && slashIndex < endIndex) {
        endIndex = slashIndex
      }
      if (domainQueryIndex !== -1 && domainQueryIndex < endIndex) {
        endIndex = domainQueryIndex
      }
      if (domainHashIndex !== -1 && domainHashIndex < endIndex) {
        endIndex = domainHashIndex
      }

      domain = urlWithoutProtocol.substring(0, endIndex)
    }

    // Strip query string while preserving hash
    const hash = hashStart !== -1 ? url.substring(hashStart) : ''
    let urlWithoutHash = queryStart !== -1 ? url.substring(0, queryStart) : url
    if (hashStart !== -1 && queryStart === -1) {
      // If there's a hash but no query string, remove the hash first
      urlWithoutHash = url.substring(0, hashStart)
    }
    const cleanUrl = urlWithoutHash + hash

    return {
      domain,
      cleanUrl,
      queryString
    }
  } catch (e) {
    return {
      domain: 'unknown',
      cleanUrl: url,
      queryString: ''
    }
  }
}