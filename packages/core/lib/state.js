// utilities for accessing and modifying mutable state
// used on client and report classes

const { keys, reduce, map, isArray, includes } = require('./es-utils')

// The value of this is not important, but a pointers to this empty object
// will signify that a value should be cleared rather than set
const CLEAR_SYMBOL = {}

// specify the immutable parts of the state tree
const IMMUTABLE = {
  'app': [ 'version', 'releaseStage' ]
}

// specify the core state tree (reports extend this with more)
const PROPS = {
  'app': {
    keys: [
      'id', 'version', 'versionCode', 'bundleVersion', 'codeBundleId',
      'buildUUID', 'releaseStage', 'type', 'dsymUUIDs', 'duration',
      'durationInForeground', 'inForeground', 'binaryArch'
    ],
    initialValue: () => ({}),
    required: true
  },
  'device': {
    keys: [
      'hostname', 'id', 'manufacturer', 'model', 'modelNumber', 'osName',
      'osVersion', 'freeMemory', 'totalMemory', 'freeDisk', 'browserName',
      'browserVersion', 'jailbroken', 'orientation', 'time', 'cpuAbi',
      'runtimeVersions'
    ],
    initialValue: () => ({}),
    required: true
  },
  'request': {
    keys: [ 'clientIp', 'headers', 'httpMethod', 'url', 'referer' ],
    initialValue: () => ({})
  },
  'threads': {
    initialValue: () => ({})
  },
  'user': {
    keys: [ 'id', 'name', 'email' ],
    initialValue: () => ({})
  },
  'context': {
    initialValue: () => undefined
  }
}

class State {
  constructor (properties, onfail = () => {}) {
    this.props = { ...PROPS, ...properties }
    this.onfail = onfail
    // set initial values for all the properties
    this.state = {}
    map(keys(this.props), key => {
      this._set({ key: key, nestedKeys: [], value: this.props[key].initialValue(), silent: true })
    })
    this._listeners = []
    this._locked = false
  }

  subscribe (cb) {
    this._listeners.push(cb)
  }

  lock () {
    this._locked = true
  }

  get (key, ...nestedKeys) {
    try {
      if (nestedKeys.length === 0) return this.state[`$__${key}`]
      return reduce(nestedKeys, (accum, k) => accum[k], this.state[`$__${key}`])
    } catch (e) {
      // implicitly return undefined when there is an error
    }
  }

  extend (other) {
    this.state = []
      .concat(keys(this.state))
      .concat(keys(other.state))
      .reduce((accum, k) => {
        if (!(k in accum)) {
          merge(accum, k, other.state[k])
          merge(accum, k, this.state[k])
        }
        return accum
      }, {})
  }

  set (...args) {
    try {
      if (args.length < 1) return
      if (args.length === 1 && args[0]) {
        this._setWithObject(args[0])
        return
      }
      this._set({ key: args[0], nestedKeys: args.slice(1, -1), value: args[args.length - 1] })
    } catch (e) {}
  }

  clear (...args) {
    try {
      this._set({ key: args[0], nestedKeys: args.slice(1), value: CLEAR_SYMBOL })
    } catch (e) {
    }
  }

  _setWithObject (updates, silent = false) {
    if (updates && typeof updates === 'object') {
      map(keys(updates), k => this._set({ key: k, nestedKeys: [], value: updates[k], silent }))
    }
  }

  _set ({ key, nestedKeys, value, silent }) {
    if (nestedKeys.length < 1) {
      if (isRequiredSection(this.props, key) && (!value || typeof value !== 'object' || value === CLEAR_SYMBOL)) {
        this.onfail(value === CLEAR_SYMBOL ? `"${key}" is required and can’t be cleared` : `"${key}" must be an object`)
        return
      }
      merge(this.state, `$__${key}`, value)
    } else {
      if (this._locked && includes(keys(IMMUTABLE), key) && includes(IMMUTABLE[key], nestedKeys[0])) {
        this.onfail(`"${key}.${nestedKeys[0]}" cannot be changed after initialisation`)
        return
      }
      if (typeof this.state[`$__${key}`] === 'undefined' && value !== CLEAR_SYMBOL) {
        this.state[`$__${key}`] = {}
      }
      reduce(nestedKeys, (accum, k, i, arr) => {
        if (!accum) return accum
        if (i === arr.length - 1) {
          merge(accum, k, value)
          return
        }
        if (!accum[k] || typeof accum[k] !== 'object') { accum[k] = {} }
        return accum[k]
      }, this.state[`$__${key}`])
    }
    if (!silent) map(this._listeners, fn => fn(key, this.state[`$__${key}`]))
  }

  toPayload () {
    const stateKeys = map(keys(this.state), k => k.replace('$__', ''))
    const propKeys = keys(this.props)
    return reduce(stateKeys, (accum, k) => {
      const val = this.state[`$__${k}`]
      const isProp = includes(propKeys, k)
      const existingMetaData = accum.metaData || {}
      if (!isProp) return { ...accum, metaData: { ...existingMetaData, [k]: val } }
      if (!isArray(this.props[k].keys)) return { ...accum, [k]: val }
      return {
        ...accum,
        metaData: { ...existingMetaData, [k]: exclude(val, this.props[k].keys) },
        [k]: pluck(val, this.props[k].keys)
      }
    }, {})
  }
}

const merge = (host, key, value) => {
  if (value === CLEAR_SYMBOL) {
    delete host[key]
  } else {
    host[key] = value && typeof value === 'object' && typeof host[key] === 'object'
      ? { ...host[key], ...value }
      : value
  }
}

const isRequiredSection = (props, k) => includes(keys(props), k) && props[k].required

// Extracts desired list of properties from an object into a new object
const pluck = (obj, allowedKeys) => {
  return reduce(keys(obj), (accum, k) => {
    return includes(allowedKeys, k) ? { ...accum, [k]: obj[k] } : accum
  }, {})
}

// Extracts all of the properties from an object except the ones listed into a new object
const exclude = (obj, disallowedKeys) => {
  return reduce(keys(obj), (accum, k) => {
    return !includes(disallowedKeys, k) ? { ...accum, [k]: obj[k] } : accum
  }, {})
}

module.exports = State
