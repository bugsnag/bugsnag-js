const makePayload = require('./lib/payload')

module.exports = {
  name: 'XDomainRequest',
  sendReport: (logger, config, report, cb = () => {}) => {
    const url = config.endpoint
    const req = new window.XDomainRequest()
    req.onload = function () {
      cb(null, req.responseText)
    }
    req.open('POST', url)
    try {
      req.send(makePayload(report))
    } catch (e) {
      logger.error(e)
    }
  }
}
