module.exports = function (headersString) {
  if (!headersString) return {}
  const arr = headersString.trim().split(/[\r\n]+/)
  const headerMap = {}
  arr.forEach((line) => {
    const parts = line.split(': ')
    const header = parts.shift()
    const value = parts.join(': ')
    headerMap[header] = value
  })
  return headerMap
}
