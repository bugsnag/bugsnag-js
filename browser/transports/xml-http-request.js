const makePayload = require('./lib/payload')

module.exports = {
  name: 'XMLHttpRequest',
  sendReport: (logger, config, report, cb = () => {}) => {
    const url = config.endpoint
    const req = new window.XMLHttpRequest()
    req.onreadystatechange = function () {
      if (req.readyState === window.XMLHttpRequest.DONE) cb(null, req.responseText)
    }
    req.open('POST', url)
    req.setRequestHeader('content-type', 'application/json')
    try {
      req.send(makePayload(report))
    } catch (e) {
      logger.error(e)
    }
  }
}
