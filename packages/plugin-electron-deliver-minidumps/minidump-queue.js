module.exports = class MinidumpQueue {
  constructor (filestore) {
    this._filestore = filestore
    this._minidumps = null
  }

  async peek () {
    if (!this._minidumps) {
      try {
        this._minidumps = await this._filestore.listMinidumps()
      } catch (e) {
        this._minidumps = []
      }
    }

    return this._minidumps[0]
  }

  remove (minidump) {
    if (!minidump) {
      return
    }

    // remove the minidump from our in-memory queue, regardless of whether we can delete the file
    // this prevents accidental re-delivery within the same session
    this._minidumps = this._minidumps && this._minidumps.filter(
      queued => queued.minidumpPath !== minidump.minidumpPath && queued.eventPath !== minidump.eventPath)

    // we ignore any file delete failures - the file has probably already been deleted
    this._filestore.deleteMinidump(minidump).catch(e => {})
  }
}
