const extensionRegex = /^(chrome|moz|safari|safari-web)-extension:/

module.exports = {
  name: 'preventDiscard',
  load: client => {
    client.addOnError(event => {
      event.errors.forEach(({ stacktrace }) => {
        stacktrace.forEach(function (frame) {
          frame.file = frame.file.replace(extensionRegex, '$1_extension:')
        })
      })
    }, true)
  }
}
