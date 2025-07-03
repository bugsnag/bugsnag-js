const isSafeLiteral = (obj: unknown): obj is string | number | boolean =>
  typeof obj === 'string' || obj instanceof String ||
  typeof obj === 'number' || obj instanceof Number ||
  typeof obj === 'boolean' || obj instanceof Boolean

const isError = (o: unknown): o is Error =>
  o instanceof Error || /^\[object (Error|(Dom)?Exception)]$/.test(Object.prototype.toString.call(o))

const throwsMessage = (err: Error) => '[Throws: ' + (err ? err.message : '?') + ']'

const safelyGetProp = (obj: object, propName: string) => {
  try {
    return obj[propName as keyof typeof obj]
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
const derecursify = (data: unknown): object => {
  const seen: Array<object | []> = []

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
    if (Array.isArray(obj)) {
      seen.push(obj)
      const safeArray = []
      try {
        for (let i = 0; i < obj.length; i++) {
          safeArray.push(visit(obj[i]))
        }
      } catch (err: any) {
        // if retrieving the Iterator fails
        return throwsMessage(err)
      }
      seen.pop()
      return safeArray
    } else if (obj instanceof Set) {
      seen.push(obj)
      const safeArray = []
      try {
        for (const value of Array.from(obj)) {
          safeArray.push(visit(value))
        }
      } catch (err: any) {
        return throwsMessage(err)
      }
      seen.pop()
      return safeArray
    } else if (obj instanceof Map) {
      seen.push(obj)
      const safeArray = []
      try {
        for (const [key, value] of Array.from(obj.entries())) {
          safeArray.push([visit(key), visit(value)])
        }
      } catch (err: any) {
        return throwsMessage(err)
      }
      seen.pop()
      return safeArray
    }

    seen.push(obj)
    const safeObj: Record<string, unknown> = {}
    for (const propName in obj) {
      safeObj[propName] = visit(safelyGetProp(obj, propName))
    }
    seen.pop()

    return safeObj
  }

  return visit(data)
}

export default derecursify
