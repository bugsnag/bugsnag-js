module.exports = {
  init: (client, NativeClient) => {
    const delegate = {
      startSession: client => {
        NativeClient.startSession()
      },
      stopSession: client => {
        NativeClient.stopSession()
      },
      resumeSession: client => {
        NativeClient.resumeSession()
      }
    }

    if (client.stopSession === undefined) {
      client.stopSession = delegate.stopSession
    }

    if (client.resumeSession === undefined) {
      client.resumeSession = delegate.resumeSession
    }

    client.sessionDelegate(delegate)
  }
}
