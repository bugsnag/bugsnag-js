const jsonStringify = require('fast-safe-stringify')

module.exports = {
  name: 'XDomainRequest',
  sendReport: (config, report, cb = () => {}) => {
    const url = config.endpoint
    const req = new window.XDomainRequest()
    req.onload = function () {
      cb(null, req.responseText)
    }
    req.open('POST', url)
    req.send(jsonStringify(report))
  },
  sendSession: (config, cb) => {}
}
