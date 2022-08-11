const isArray = require('./es-utils/is-array')
const reduce = require('./es-utils/reduce')
const findIndex = require('./es-utils/find-index')
const jsonStringify = require('@bugsnag/safe-json-stringify')

function add (existingFeatures = [], name, variant) {
  if (typeof name !== 'string') {
    return
  }

  if (variant === undefined) {
    variant = null
  } else if (variant !== null && typeof variant !== 'string') {
    variant = jsonStringify(variant)
  }

  var found = false
  for (var i = 0; i < existingFeatures.length; i++) {
    if (existingFeatures[i].name === name) {
      found = true
      existingFeatures[i].variant = variant
      break
    }
  }

  if (!found) existingFeatures.push({ name, variant })
}

function merge (existingFeatures, newFeatures) {
  if (!isArray(newFeatures)) {
    return
  }

  for (let i = 0; i < newFeatures.length; ++i) {
    const feature = newFeatures[i]

    if (feature === null || typeof feature !== 'object') {
      continue
    }

    // 'add' will handle if 'name' doesn't exist & 'variant' is optional
    add(existingFeatures, feature.name, feature.variant)
  }
}

// convert feature flags from a map of { name: 'name', variant: 'variant'} into the format required
// by the Bugsnag Event API:
//   [{ featureFlag: 'name', variant: 'variant' }, { featureFlag: 'name 2' }]
function toEventApi (featureFlags) {
  return reduce(featureFlags, (accum, { name, variant }) => {
    const index = findIndex(accum, ({ featureFlag }) => name === featureFlag)

    if (index > -1) {
      if (variant) accum[index].variant = variant
      return accum
    } else {
      return [...accum, { featureFlag: name, ...(variant ? { variant } : {}) }]
    }
  }, [])
}

module.exports = { add, merge, toEventApi }
