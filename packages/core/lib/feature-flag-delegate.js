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

module.exports = { add, merge }
