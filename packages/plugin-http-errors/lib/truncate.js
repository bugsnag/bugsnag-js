/**
   * Truncate string to max length
   * @param {string} str - String to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated string
   */
const truncate = (str, maxLength) => {
  if (!str || str.length <= maxLength) return str
  return str.substring(0, maxLength)
}

module.exports = truncate
