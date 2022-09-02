const map = require('./es-utils/map')
const filter = require('./es-utils/filter')
const isArray = require('./es-utils/is-array')
const jsonStringify = require('@bugsnag/safe-json-stringify')

function add (existingFeatures, existingFeatureKeys, name, variant) {
  if (typeof name !== 'string') {
    return
  }

  if (variant === undefined) {
    variant = null
  } else if (variant !== null && typeof variant !== 'string') {
    variant = jsonStringify(variant)
  }

  const existingIndex = existingFeatureKeys[name]
  if (typeof existingIndex === 'number') {
    existingFeatures[existingIndex] = { name, variant }
    return
  }

  existingFeatures.push({ name, variant })
  existingFeatureKeys[name] = existingFeatures.length - 1
}

function merge (existingFeatures, newFeatures, existingFeatureKeys) {
  if (!isArray(newFeatures)) {
    return
  }

  for (let i = 0; i < newFeatures.length; ++i) {
    const feature = newFeatures[i]

    if (feature === null || typeof feature !== 'object') {
      continue
    }

    // 'add' will handle if 'name' doesn't exist & 'variant' is optional
    add(existingFeatures, existingFeatureKeys, feature.name, feature.variant)
  }

  return existingFeatures
}

// convert feature flags from a map of 'name -> variant' into the format required
// by the Bugsnag Event API:
//   [{ featureFlag: 'name', variant: 'variant' }, { featureFlag: 'name 2' }]
function toEventApi (featureFlags) {
  return map(
    filter(featureFlags, Boolean),
    ({ name, variant }) => {
      const flag = { featureFlag: name }

      // don't add a 'variant' property unless there's actually a value
      if (typeof variant === 'string') {
        flag.variant = variant
      }

      return flag
    }
  )
}

function clear (features, featuresIndex, name) {
  const existingIndex = featuresIndex[name]
  if (typeof existingIndex === 'number') {
    features[existingIndex] = null
    delete featuresIndex[name]
  }
}

module.exports = { add, clear, merge, toEventApi }
