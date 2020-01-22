module.exports = {
  init: (client, NativeClient) => {
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
}
