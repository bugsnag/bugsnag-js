module.exports = (client, NativeClient) => ({
  sendEvent: (payload, cb = () => {}) => {
    const event = payload.events[0]
    // this is because JS beforeSend operates on the event – report is not in scope
    // report.threads = event.get('threads')
    NativeClient.dispatch(event.toJSON()).then(() => cb()).catch(cb)
  },
  sendSession: () => {
    // TODO: log/warn here? If this gets used the something has gone wrong…
  }
})
