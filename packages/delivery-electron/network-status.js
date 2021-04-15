module.exports = class NetworkStatus {
  constructor ({ emitter }, net, app) {
    this.isReady = app.isReady()

    // if the app isn't ready, emit an update when it is
    if (!this.isReady) {
      app.whenReady().then(() => {
        this.isReady = true
        this._update(net.online)
      })
    }

    // the net module can't be used if the app is ready, so act as if we're
    // offline until then
    this.isConnected = this.isReady ? net.online : false
    this._watchers = []

    emitter.on('MetadataUpdate', ({ section, values }) => {
      if (section === 'device' && typeof values.online === 'boolean') {
        this._update(values.online)
      }
    })

    emitter.on('MetadataReplace', ({ metadata }) => {
      if (metadata.device && typeof metadata.device.online === 'boolean') {
        this._update(metadata.device.online)
      }
    })
  }

  watch (fn) {
    this._watchers.push(fn)
    fn(this.isConnected)
  }

  _update (isConnected) {
    // ignore the update if the app is not ready or this is a duplicate
    if (typeof isConnected !== 'boolean' || isConnected === this.isConnected || this.isReady === false) {
      return
    }

    this.isConnected = isConnected
    this._watchers.forEach(w => w(this.isConnected))
  }
}
