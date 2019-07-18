module.exports = (client, NativeClient) => ({
  sendReport: (payload, cb = () => {}) => {
    const event = payload.events[0]
    const report = event.toJSON()
    // this is because JS beforeSend operates on the event – report is not in scope
    report.threads = event.get('threads')
    NativeClient.deliver(report).then(cb).catch(cb)
  },
  sendSession: () => {
    // TODO: log/warn here? If this gets used the something has gone wrong…
  }
})
