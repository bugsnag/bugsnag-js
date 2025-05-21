import assign from './es-utils/assign'

interface MetadataDelegate {
  add: (state: { [key: string]: any }, section: string, keyOrObj?: object | string, maybeVal?: any) => any
  get: (state: { [key: string]: any }, section: string, key?: string | undefined) => any
  clear: (state: { [key: string]: any }, section: string, key?: string | undefined) => any
}

const metadataDelegate: MetadataDelegate = {
  add: (state, section, keyOrObj, maybeVal) => {
    if (!section) return
    let updates

    // addMetadata("section", null) -> clears section
    if (keyOrObj === null) return metadataDelegate.clear(state, section);

    // normalise the two supported input types into object form
    if (typeof keyOrObj === 'object') updates = keyOrObj
    if (typeof keyOrObj === 'string') updates = { [keyOrObj]: maybeVal }

    // exit if we don't have an updates object at this point
    if (!updates) return

    // preventing the __proto__ property from being used as a key
    if (section === '__proto__' || section === 'constructor' || section === 'prototype') {
      return
    }

    // ensure a section with this name exists
    if (!state[section]) state[section] = {}

    // merge the updates with the existing section
    state[section] = assign({}, state[section], updates)
  },

  get: (state, section, key) => {
    if (typeof section !== 'string') return undefined
    if (!key) {
      return state[section]
    }
    if (state[section]) {
      return state[section][key]
    }
    return undefined
  },

  clear: (state, section, key) => {
    if (typeof section !== 'string') return

    // clear an entire section
    if (!key) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete state[section]
      return
    }

    // preventing the __proto__ property from being used as a key
    if (section === '__proto__' || section === 'constructor' || section === 'prototype') {
      return
    }

    // clear a single value from a section
    if (state[section]) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete state[section][key]
    }
  }
}

export default metadataDelegate;