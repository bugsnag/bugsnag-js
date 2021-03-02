let appStart = new Date()
const reset = () => { appStart = new Date() }

module.exports = {
  name: 'appDuration',
  load: client => {
    client.addOnError(event => {
      const now = new Date()

      event.app.duration = now - appStart
    }, true)

    return { reset }
  }
}
