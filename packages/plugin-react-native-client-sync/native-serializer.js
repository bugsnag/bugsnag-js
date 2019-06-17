const isError = require('iserror')

const allowedMapObjectTypes = [ 'string', 'number', 'boolean' ]

/**
 * Convert an object into a structure with types suitable for serializing
 * across to native code.
 */
const serializeForNativeLayer = (map, logger, maxDepth = 10, depth = 0, seen = new Set()) => {
  seen.add(map)
  const output = {}
  if (isError(map)) {
    map = extractErrorDetails(map)
  }
  for (const key in map) {
    // Skip inherited properties
    if (!{}.hasOwnProperty.call(map, key)) continue

    const value = map[key]

    // Checks for `null`, NaN, and `undefined`.
    if ([ undefined, null ].includes(value) || (typeof value === 'number' && isNaN(value))) {
      output[key] = { type: 'string', value: String(value) }
    } else if (typeof value === 'object') {
      if (seen.has(value)) {
        output[key] = { type: 'string', value: '[circular]' }
      } else if (depth === maxDepth) {
        output[key] = { type: 'string', value: '[max depth exceeded]' }
      } else {
        output[key] = { type: 'map', value: serializeForNativeLayer(value, logger, maxDepth, depth + 1, seen) }
      }
    } else {
      const type = typeof value
      if (allowedMapObjectTypes.includes(type)) {
        output[key] = { type: type, value: value }
      } else if (logger) {
        logger.warn(`Could not serialize data for '${key}': Invalid type '${type}'`)
      }
    }
  }
  return output
}

const extractErrorDetails = (err) => {
  const { message, stack, name } = err
  return { message, stack, name }
}

module.exports = serializeForNativeLayer
