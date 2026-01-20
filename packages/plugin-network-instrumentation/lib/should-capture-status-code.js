/**
 * Check if a status code should be captured
 * @param {number[]} codes - Array of HTTP status codes
 * @param {number} statusCode - HTTP status code
 * @returns {boolean} True if should be captured
 */
module.exports = function (codes, statusCode) {
  return codes.some(code => {
    if (typeof code === 'number') {
      return code === statusCode
    }
    if (code && typeof code === 'object' && 'min' in code && 'max' in code) {
      return statusCode >= code.min && statusCode <= code.max
    }
    return false
  })
}
