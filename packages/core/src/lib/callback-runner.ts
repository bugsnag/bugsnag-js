import some from './async-every'

import type { NodeCallbackType } from './async-every'

const runCallbacks = <T>(
  callbacks: any,
  event: T,
  onCallbackError: (err: Error) => void,
  cb: NodeCallbackType<boolean>
): void => {
  // This function is how we support different kinds of callback:
  //  - synchronous - return value
  //  - node-style async with callback - cb(err, value)
  //  - promise/thenable - resolve(value)
  // It normalises each of these into the lowest common denominator – a node-style callback
  const runMaybeAsyncCallback = (fn: any, cb: NodeCallbackType<boolean>) => {
    if (typeof fn !== "function") return cb(null)
    try {
      // if function appears sync…
      if (fn.length !== 2) {
        const ret = fn(event)
        // check if it returned a "thenable" (promise)
        if (ret && typeof ret.then === "function") {
          return ret.then(
            // resolve
            (val: boolean | undefined ) => setTimeout(() => cb(null, val)),
            // reject
            (err: Error) => {
              setTimeout(() => {
                onCallbackError(err)
                return cb(null, true)
              })
            }
          )
        }
        return cb(null, ret)
      }
      // if function is async…
      fn(event, (err: Error, result: any) => {
        if (err) {
          onCallbackError(err)
          return cb(null)
        }
        cb(null, result)
      })
    } catch (e: any) {
      onCallbackError(e)
      cb(null)
    }
  }

  return some(callbacks, runMaybeAsyncCallback, cb)
}

export default runCallbacks