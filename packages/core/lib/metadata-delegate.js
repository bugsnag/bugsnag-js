const assign = require('./es-utils/assign')

const add = (state, section, ...args) => {
  if (!section) return
  let updates

  // addMetadata("section", null) -> clears section
  if (args[0] === null) return clear(state, section)

  // normalise the two supported input types into object form
  if (typeof args[0] === 'object') updates = args[0]
  if (typeof args[0] === 'string') updates = { [args[0]]: args[1] }

  // exit if we don't have an updates object at this point
  if (!updates) return

  // ensure a section with this name exists
  if (!state[section]) state[section] = {}

  // merge the updates with the existing section
  state[section] = assign({}, state[section], updates)
}

const get = (state, section, key) => {
  if (typeof section !== 'string') return undefined
  if (!key) {
    return state[section]
  }
  if (state[section]) {
    return state[section][key]
  }
  return undefined
}

const clear = (state, section, key) => {
  if (typeof section !== 'string') return

  // clear an entire section
  if (!key) {
    delete state[section]
    return
  }

  // clear a single value from a section
  if (state[section]) {
    delete state[section][key]
  }
}

module.exports = { add, get, clear }
