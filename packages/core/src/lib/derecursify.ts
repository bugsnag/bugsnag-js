import isArray from './es-utils/is-array'

const isSafeLiteral = (obj: unknown): obj is string | number | boolean =>
  typeof obj === 'string' || obj instanceof String ||
  typeof obj === 'number' || obj instanceof Number ||
  typeof obj === 'boolean' || obj instanceof Boolean

const isError = (o: unknown): o is Error =>
  o instanceof Error || /^\[object (Error|(Dom)?Exception)]$/.test(Object.prototype.toString.call(o))

const throwsMessage = (err: Error) => '[Throws: ' + (err ? err.message : '?') + ']'

const safelyGetProp = (obj: Object, propName: keyof Object) => {
  try {
    return obj[propName]
  } catch (err: any) {
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
const derecursify = (data: unknown): {} => {
  const seen: Array<Object | []> = []

  const visit = (obj: unknown): any => {
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
    if (isArray(obj) || obj instanceof Set || obj instanceof Map) {
      seen.push(obj)
      const safeArray = []
      try {
        for (const value of obj) {
          safeArray.push(visit(value))
        }
      } catch (err: any) {
        // if retrieving the Iterator fails
        return throwsMessage(err)
      }
      seen.pop()
      return safeArray
    }

    seen.push(obj)
    const safeObj = {}
    for (const propName in obj) {
      const typedPropName = propName as keyof Object
      safeObj[typedPropName] = visit(safelyGetProp(obj, typedPropName))
    }
    seen.pop()

    return safeObj
  }

  return visit(data)
}

export default derecursify
