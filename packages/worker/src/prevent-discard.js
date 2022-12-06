module.exports = {
  name: 'preventDiscard',
  load: client => {
    client.addOnError(event => {
      event.errors[0].stacktrace = event.errors[0].stacktrace.map(function (frame) {
        frame.file = frame.file.replace(/chrome-extension:/g, 'chrome_extension:')
        frame.file = frame.file.replace(/moz-extension:/g, 'moz_extension:')
        frame.file = frame.file.replace(/safari-extension:/g, 'safari_extension:')
        frame.file = frame.file.replace(/safari-web-extension:/g, 'safari_web_extension:')
        return frame
      })
    }, true)
  }
}
