/**
 * Receives the XHR response and parses it based on the responseType
 * @param {XMLHttpRequest} xhr The XHR instance
 * @returns {string | undefined} The parsed response
 */
module.exports = function xhrResponseParser ({ response, responseType }) {
  if (response === null || response === undefined) {
    return undefined
  }

  switch (responseType) {
    case 'arraybuffer':
    case 'blob':
      return '[Binary Data]'
    case 'document':
      return '[Document]'
    case 'json':
      try {
        return JSON.stringify(response)
      } catch (e) {
        return '[Unserializable JSON]'
      }
    case 'text':
    case '':
    default:
      return String(response)
  }
}
