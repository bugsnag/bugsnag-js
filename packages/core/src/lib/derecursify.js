const isArray = require('./es-utils/is-array')

const isSafeLiteral = (obj) => (
  typeof obj === 'string' || obj instanceof String ||
  typeof obj === 'number' || obj instanceof Number ||
  typeof obj === 'boolean' || obj instanceof Boolean
)

const isError = o => (
  o instanceof Error || /^\[object (Error|(Dom)?Exception)]$/.test(Object.prototype.toString.call(o))
)

const throwsMessage = err => '[Throws: ' + (err ? err.message : '?') + ']'

const safelyGetProp = (obj, propName) => {
  try {
    return obj[propName]
  } catch (err) {
    return throwsMessage(err)
  }
}

/**
 * Similar to `safe-json-stringify` this function rebuilds an object graph without any circular references.
 * This requirement is different to `JSON.parse(safeJsonStringify(data))` in three key ways:
 * - `toJSON` methods are not called
 * - there is no redaction or fixed depth limit
 *
 * @param data the value to be made safe for the ReactNative bridge
 * @returns a safe version of the given `data`
 */
module.exports = function (data) {
  const seen = []

  const visit = (obj) => {
    if (obj === null || obj === undefined) return obj

    if (isSafeLiteral(obj)) {
      return obj
    }

    if (isError(obj)) {
      return visit({ name: obj.name, message: obj.message })
    }

    if (obj instanceof Date) {
      return obj.toISOString()
    }

    if (seen.includes(obj)) {
      // circular references are replaced and marked
      return '[Circular]'
    }

    // handle arrays, and all iterable non-array types (such as Set)
    if (isArray(obj) || obj[Symbol.iterator]) {
      seen.push(obj)
      const safeArray = []
      try {
        for (const value of obj) {
          safeArray.push(visit(value))
        }
      } catch (err) {
        // if retrieving the Iterator fails
        return throwsMessage(err)
      }
      seen.pop()
      return safeArray
    }

    seen.push(obj)
    const safeObj = {}
    for (const propName in obj) {
      safeObj[propName] = visit(safelyGetProp(obj, propName))
    }
    seen.pop()

    return safeObj
  }

  return visit(data)
}
