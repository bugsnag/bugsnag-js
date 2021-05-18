module.exports = {
  load (client) {
    client.addOnError(event => {
      const allFrames = event.errors.reduce((accum, er) => accum.concat(er.stacktrace), [])

      allFrames.forEach(stackframe => {
        if (typeof stackframe.file !== 'string') {
          return
        }

        stackframe.file = stackframe.file.replace(/\\/g, '/')
      })
    })
  }
}
