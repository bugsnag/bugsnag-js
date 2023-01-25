module.exports = () => ({
  load: (client) => {
    client.addOnError(event => {
      console.log('in Hermes OnError callback')
      if (event.errors && event.errors.length) {
        event.errors[0].stacktrace.forEach(sf => {
          if (!sf.file) return
          sf.file = sf.file.replace(/^address at /, '')
        })
      }
    }, true)
  }
})
