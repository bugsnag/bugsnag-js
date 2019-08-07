const FileSystem = require('expo-file-system')

const MAX_ITEMS = 64
const PAYLOAD_PATH = `${FileSystem.cacheDirectory}bugsnag`
const filenameRe = /^bugsnag-.*\.json$/

/*
 * This class resembles FIFO queue in which to store undelivered payloads.
 */
module.exports = class UndeliveredPayloadQueue {
  constructor (resource, onerror = () => {}) {
    this._resource = resource
    this._path = `${PAYLOAD_PATH}/${this._resource}`
    this._onerror = onerror
    this._truncating = false
    this._initCall = null
  }

  /*
   * Calls _init(), ensuring it only does that task once returning
   * the same promise to each concurrent caller
   */
  async init () {
    // we don't want multiple calls to init() to incur multiple attempts at creating
    // the directory, so we assign the existing _init() call
    if (this._initCall) return this._initCall
    this._initCall = this._init()
      .then(() => { this._initCall = null })
      .catch(e => {
        this._initCall = null
        throw e
      })
    return this._initCall
  }

  /*
   * Ensure the persistent cache directory exists
   */
  async _init () {
    if (await this._checkCacheDirExists()) return
    try {
      await FileSystem.makeDirectoryAsync(this._path, { intermediates: true })
    } catch (e) {
      // Expo has a bug where `makeDirectoryAsync` can error, even though it succesfully
      // created the directory. See:
      //   https://github.com/expo/expo/issues/2050
      //   https://forums.expo.io/t/makedirectoryasync-error-could-not-be-created/11916
      //
      // To tolerate this, after getting an error, we check whether the directory
      // now exist, swallowing the error if so, rethrowing if not.
      if (await this._checkCacheDirExists()) return
      throw e
    }
  }

  /*
   * Check if the cache directory exists
   */
  async _checkCacheDirExists () {
    const { exists, isDirectory } = await FileSystem.getInfoAsync(this._path)
    return exists && isDirectory
  }

  /*
   * Keeps the queue size bounded by MAX_LENGTH
   */
  async _truncate () {
    // this isn't atomic so only enter this method once at any time
    if (this._truncating) return
    this._truncating = true

    try {
      // list the payloads in order
      const payloads = (await FileSystem.readDirectoryAsync(this._path))
        .filter(f => filenameRe.test(f)).sort()

      // figure out how many over MAX_ITEMS we are
      const diff = payloads.length - MAX_ITEMS

      // do nothing if within the limit
      if (diff < 0) {
        this._truncating = false
        return
      }

      // wait for each of the items over the limit to be removed
      await Promise.all(
        payloads.slice(0, diff)
          .map(f => this.remove(`${this._path}/${f}`))
      )

      // done
      this._truncating = false
    } catch (e) {
      this._truncating = false
      this._onerror(e)
    }
  }

  /*
   * Adds an item to the end of the queue
   */
  async enqueue (req) {
    try {
      await this.init()
      await FileSystem.writeAsStringAsync(
        `${this._path}/${generateFilename(this._resource)}`,
        JSON.stringify({ ...req, retries: 0 })
      )
      this._truncate()
    } catch (e) {
      this._onerror(e)
    }
  }

  /*
   * Returns the oldest item in the queue without removing it
   */
  async peek () {
    try {
      const payloads = await FileSystem.readDirectoryAsync(this._path)
      const payloadFileName = payloads.filter(f => filenameRe.test(f)).sort()[0]
      if (!payloadFileName) return null
      const id = `${this._path}/${payloadFileName}`

      try {
        const payloadJson = await FileSystem.readAsStringAsync(id)
        const payload = JSON.parse(payloadJson)
        return { id, payload }
      } catch (e) {
        // if we got here it's because
        // a) JSON.parse failed or
        // b) the file can no longer be read (maybe it was truncated?)
        // in both cases we want to speculatively remove it and try peeking again
        await this.remove(id)
        return this.peek()
      }
    } catch (e) {
      this._onerror(e)
      return null
    }
  }

  /*
   * Removes an item from the queue by its id (full path).
   * Tolerant of errors while removing.
   */
  async remove (id) {
    try {
      await FileSystem.deleteAsync(id)
    } catch (e) {
      this._onerror(e)
    }
  }

  /*
   * Applies the provided updates to an item. This does a 1-level shallow merge on
   * an object, i.e. it replaces top level keys
   */
  async update (id, updates) {
    try {
      const payloadJson = await FileSystem.readAsStringAsync(id)
      const payload = JSON.parse(payloadJson)
      const updatedPayload = { ...payload, ...updates }
      await FileSystem.writeAsStringAsync(id, JSON.stringify(updatedPayload))
    } catch (e) {
      this._onerror(e)
    }
  }
}

// create a random 16 byte uri
const uid = () => {
  return Array(16).fill(1).reduce((accum, val) => {
    return accum + Math.floor(Math.random() * 10).toString()
  }, '')
}

const generateFilename = module.exports.generateFilename = resource =>
  `bugsnag-${resource}-${(new Date()).toISOString()}-${uid()}.json`
