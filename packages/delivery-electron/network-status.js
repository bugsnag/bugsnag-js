module.exports = class NetworkStatus {
  constructor ({ emitter }, net = {}) {
    this.isConnected = typeof net.online === 'boolean' ? net.online : true
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
    if (typeof isConnected !== 'boolean' || isConnected === this.isConnected) return
    this.isConnected = isConnected
    this._watchers.forEach(w => w(this.isConnected))
  }
}
