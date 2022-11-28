module.exports = () => ({
  load: (client) => {
    client.addOnError(event => {
      console.log('in Hermes OnError callback')
      if (event.errors && event.errors.length) {
        event.errors[0].stacktrace.forEach(sf => {
          if (!sf.file) {
            console.log('sf.file is falsey', sf)
            return
          }
          sf.file = sf.file.replace(/^address at /, '')
        })
      }
      console.log('exiting Hermes callback')
    }, true)
  }
})
