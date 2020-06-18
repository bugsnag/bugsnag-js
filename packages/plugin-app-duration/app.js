const appStart = new Date()

module.exports = {
  load: client => {
    client.addOnError(event => {
      const now = new Date()

      event.app.duration = now - appStart
    }, true)
  }
}
