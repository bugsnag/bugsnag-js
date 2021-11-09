const map = require('./es-utils/map')
const keys = require('./es-utils/keys')
const isArray = require('./es-utils/is-array')
const jsonStringify = require('@bugsnag/safe-json-stringify')

function add (existingFeatures, name, variant) {
  if (typeof name !== 'string') {
    return
  }

  if (variant === undefined) {
    variant = null
  } else if (variant !== null && typeof variant !== 'string') {
    variant = jsonStringify(variant)
  }

  existingFeatures[name] = variant
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

// convert feature flags from a map of 'name -> variant' into the format required
// by the Bugsnag Event API:
//   [{ featureFlag: 'name', variant: 'variant' }, { featureFlag: 'name 2' }]
function toEventApi (featureFlags) {
  return map(
    keys(featureFlags),
    name => {
      const flag = { featureFlag: name }

      // don't add a 'variant' property unless there's actually a value
      if (typeof featureFlags[name] === 'string') {
        flag.variant = featureFlags[name]
      }

      return flag
    }
  )
}

module.exports = { add, merge, toEventApi }
