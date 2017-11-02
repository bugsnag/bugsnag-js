const jsonStringify = require('fast-safe-stringify')

module.exports = {
  name: 'XMLHttpRequest',
  sendReport: (config, report, cb = () => {}) => {
    const url = config.endpoint
    const req = new window.XMLHttpRequest()
    req.onreadystatechange = function () {
      if (req.readyState === window.XMLHttpRequest.DONE) cb(null, req.responseText)
    }
    req.open('POST', url)
    req.setRequestHeader('content-type', 'application/json')
    req.send(jsonStringify(report))
  }
}
