module.exports = NativeClient => ({
  load: (client) => {
    const delegate = {
      startSession: client => {
        NativeClient.startSession()
        return client
      },
      pauseSession: client => {
        NativeClient.pauseSession()
      },
      resumeSession: client => {
        NativeClient.resumeSession()
        return client
      }
    }

    client._sessionDelegate = delegate
  }
})
