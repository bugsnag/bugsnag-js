module.exports = {
  add (section, ...args) {
    if (!section) return this
    let updates

    // addMetadata("section", null) -> clears section
    if (args[0] === null) return this.clearMetadata(section)

    // normalise the two supported input types into object form
    if (typeof args[0] === 'object') updates = args[0]
    if (typeof args[0] === 'string') updates = { [args[0]]: args[1] }

    // exit if we don't have an updates object at this point
    if (!updates) return this

    // ensure a section with this name exists
    if (!this._metadata[section]) this._metadata[section] = {}

    // merge the updates with the existing section
    this._metadata[section] = { ...this._metadata[section], ...updates }

    return this
  },

  get (section, key) {
    if (typeof section !== 'string') return undefined
    if (!key) {
      return this._metadata[section]
    }
    if (this._metadata[section]) {
      return this._metadata[section][key]
    }
    return undefined
  },

  clear (section, key) {
    if (typeof section !== 'string') return this

    // clear an entire section
    if (!key) {
      delete this._metadata[section]
      return this
    }

    // clear a single value from a section
    if (this._metadata[section]) {
      delete this._metadata[section][key]
      return this
    }

    return this
  }
}
