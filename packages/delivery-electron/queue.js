const { join } = require('path')
const { promises } = require('fs')
const { mkdir, readdir, writeFile, readFile, unlink } = promises
const { randomBytes } = require('crypto')

const MAX_ITEMS = 64
const filenameRe = /^bugsnag-.*\.json$/
// using custom format over toISOString to avoid windows path issues around ':'
const formatDate = (date) => date.toISOString().replace(/[^0-9]/g, '')

module.exports = class PayloadQueue {
  constructor (path, resource, onerror = () => {}) {
    this._onerror = onerror
    this._path = path
    this._truncating = false
    this._generateFilename = () =>
      `bugsnag-${resource}-${formatDate(new Date())}-${uid()}.json`
    this._init = null
  }

  /*
   * Create storage path (if needed). Succeeds if the directory is created or
   * already exists.
   */
  async init () {
    if (!this._init) { // initialize only once
      this._init = mkdir(this._path, { recursive: true })
    }

    return this._init
  }

  /*
   * Adds an item to the end of the queue
   */
  async enqueue (item) {
    try {
      if (!isValidPayload(item)) {
        throw new Error('Invalid payload!')
      }

      await this.init()
      const data = JSON.stringify(item)
      await writeFile(join(this._path, this._generateFilename()), data)
      await this._truncate()
    } catch (e) {
      this._onerror(e)
    }
  }

  /*
   * Returns the oldest item in the queue without removing it
   */
  async peek () {
    try {
      const payloads = await this._getPayloads()
      // loop from first to last until we find a valid payload
      for (const filepath of payloads) {
        try {
          const payload = JSON.parse(await readFile(filepath))

          if (!isValidPayload(payload)) {
            throw new Error('Invalid payload!')
          }

          return { path: filepath, payload }
        } catch (e) {
          // if we got here it's because
          // a) JSON.parse failed
          // b) the file can no longer be read (maybe it was truncated?)
          // c) the contents of the parsed file isn't a valid payload
          // in any case we want to speculatively remove it and try the next result
          await this.remove(filepath)
        }
      }
    } catch (e) {
      this._onerror(e)
    }
    // no payloads or all were invalid (and removed)
    return null
  }

  /*
   * Removes an item from the queue by its full path.
   * Tolerant of errors while removing.
   */
  async remove (filepath) {
    try {
      await unlink(filepath)
    } catch (e) {
      this._onerror(e)
    }
  }

  /*
   * Keeps the queue size bounded by MAX_ITEMS
   * Tolerant of errors while removing.
   */
  async _truncate () {
    // this isn't atomic so only enter this method once at any time
    if (this._truncating) return
    this._truncating = true

    try {
      const payloads = await this._getPayloads()

      // figure out how many over MAX_ITEMS we are
      const diff = payloads.length - MAX_ITEMS

      // do nothing if within the limit
      if (diff > 0) {
        // wait for each of the items over the limit to be removed
        await Promise.all(
          payloads.slice(0, diff)
            .map(f => this.remove(f))
        )
      }
    } catch (e) {
      this._onerror(e)
    } finally {
      this._truncating = false
    }
  }

  /*
   * List the payloads in order
   */
  async _getPayloads () {
    return (await readdir(this._path, { withFileTypes: true }))
      .filter(f => f.isFile() && filenameRe.test(f.name))
      .map(f => join(this._path, f.name))
      .sort()
  }
}

const uid = () => randomBytes(8).toString('hex')
const isValidPayload = payload =>
  payload.opts && typeof payload.opts === 'object' &&
    typeof payload.opts.url === 'string' &&
    typeof payload.opts.method === 'string' &&
    payload.opts.headers && typeof payload.opts.headers === 'object' &&
    typeof payload.body === 'string'
