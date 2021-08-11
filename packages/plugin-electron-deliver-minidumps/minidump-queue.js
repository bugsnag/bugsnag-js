module.exports = class MinidumpQueue {
  constructor (filestore) {
    this._filestore = filestore
    this._removedMinidumpPaths = new Set()
  }

  async peek () {
    try {
      const minidumps = await this._filestore.listMinidumps()
      return minidumps.find(minidump => !this._removedMinidumpPaths.has(minidump.minidumpPath))
    } catch (e) {
    }
  }

  remove (minidump) {
    if (!minidump) {
      return
    }

    // we mark the minidump file as "removed" to avoid problems if we cannot delete the file
    this._removedMinidumpPaths.add(minidump.minidumpPath)

    // we ignore any file delete failures - the file has probably already been deleted
    this._filestore.deleteMinidump(minidump).catch(e => {})
  }
}
