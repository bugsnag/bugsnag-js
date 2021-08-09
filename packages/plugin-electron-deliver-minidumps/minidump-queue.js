module.exports = class MinidumpQueue {
  constructor (filestore) {
    this._filestore = filestore
  }

  async peek () {
    try {
      const minidumps = await this._filestore.listMinidumps()
      return minidumps[0]
    } catch (e) {
    }
  }

  remove (minidump) {
    if (!minidump) {
      return
    }

    // we ignore any file delete failures - the file has probably already been deleted
    this._filestore.deleteMinidump(minidump).catch(e => {})
  }
}
