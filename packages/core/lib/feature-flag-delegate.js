const jsonStringify = require('@bugsnag/safe-json-stringify')

class FeatureFlagDelegate {
  constructor (initialFlags) {
    this.flags = []
    this.flagKeys = {}

    if (initialFlags) {
      initialFlags.forEach(flag => {
        this.add(flag.name || flag.featureFlag, flag.variant)
      })
    }
  }

  add (featureFlag, variant) {
    if (typeof featureFlag !== 'string') {
      return
    }

    if (variant !== null && variant !== undefined && typeof variant !== 'string') {
      variant = jsonStringify(variant)
    }

    const flagObject = { featureFlag, ...(variant ? { variant } : {}) }

    const existingIndex = this.flagKeys[featureFlag]
    if (typeof existingIndex === 'number') {
      this.flags[existingIndex] = flagObject
      return
    }

    this.flags.push(flagObject)
    this.flagKeys[featureFlag] = this.flags.length - 1
  }

  list () {
    return this.toJSON()
  }

  clear (featureFlag) {
    const existingIndex = this.flagKeys[featureFlag]
    if (typeof existingIndex === 'number') {
      this.flags[existingIndex] = null
      delete this.flagKeys[featureFlag]
    }
  }

  mergeFrom (otherDelegate) {
    if (otherDelegate && otherDelegate.flags) {
      otherDelegate.flags.forEach(flag => {
        if (flag) {
          this.add(flag.featureFlag, flag.variant)
        }
      })
    }
  }

  toJSON () {
    return this.flags.filter(Boolean)
  }
}

module.exports = FeatureFlagDelegate
