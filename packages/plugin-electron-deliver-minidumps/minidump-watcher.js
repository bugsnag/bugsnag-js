const { watch, readdir } = require('fs')
const { join } = require('path')

module.exports = class MinidumpWatcher {
  constructor (mindumpLoop, minidumpsPath) {
    this._mindumpLoop = mindumpLoop
    this._minidumpsPath = minidumpsPath
    this._watchers = []
    this._started = false
  }

  start () {
    if (this._started) {
      return
    }

    this._started = true
    this._watch(this._minidumpsPath)
    readdir(this._minidumpsPath, { withFileTypes: true }, (err, children) => {
      // handle cases when stop() was called before this callback
      if (err || !this._started) return

      children
        .filter(dirent => dirent.isDirectory())
        .map(dirent => join(this._minidumpsPath, dirent.name))
        .forEach(path => this._watch(path))
    })
  }

  _watch (dir) {
    this._watchers.push(watch(dir, {}, eventType => {
      if (eventType === 'rename') {
        // there is a change in the directory - make sure the minidumpLoop is started and it will do the rest
        this._mindumpLoop.start()
      }
    }))
  }

  stop () {
    this._watchers.forEach(watcher => watcher.close())
    this._watchers = []
    this._started = false
  }

  watchNetworkStatus (statusUpdater) {
    statusUpdater.watch(connected => {
      if (connected) this.start()
      else this.stop()
    })
  }
}
