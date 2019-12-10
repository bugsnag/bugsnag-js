const NetInfo = require('@react-native-community/netinfo')

/*
 * This class provides the following:
 *   - a boolean `isConnected` property which reflects the current status
 *   - a `watch(fn)` calls a callback to be called whenever isConnected changes state
 */
module.exports = class NetworkStatus {
  constructor () {
    this.isConnected = false
    this._watchers = []
    this._watch()
  }

  watch (fn) {
    this._watchers.push(fn)
    fn(this.isConnected)
  }

  _update (isConnected) {
    this.isConnected = isConnected
    this._watchers.forEach(w => w(this.isConnected))
  }

  _watch () {
    // get the initial status
    NetInfo.fetch().then(state => {
      this._update(state.isConnected)
      // then listen for subsequent changes
      NetInfo.addEventListener(state => {
        this._update(state.isConnected)
      })
    })
  }
}
