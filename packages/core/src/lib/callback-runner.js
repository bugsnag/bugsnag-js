const some = require('./async-every')

module.exports = (callbacks, event, onCallbackError, cb) => {
  // This function is how we support different kinds of callback:
  //  - synchronous - return value
  //  - node-style async with callback - cb(err, value)
  //  - promise/thenable - resolve(value)
  // It normalises each of these into the lowest common denominator – a node-style callback
  const runMaybeAsyncCallback = (fn, cb) => {
    if (typeof fn !== 'function') return cb(null)
    try {
      // if function appears sync…
      if (fn.length !== 2) {
        const ret = fn(event)
        // check if it returned a "thenable" (promise)
        if (ret && typeof ret.then === 'function') {
          return ret.then(
            // resolve
            val => setTimeout(() => cb(null, val)),
            // reject
            err => {
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
      fn(event, (err, result) => {
        if (err) {
          onCallbackError(err)
          return cb(null)
        }
        cb(null, result)
      })
    } catch (e) {
      onCallbackError(e)
      cb(null)
    }
  }

  some(callbacks, runMaybeAsyncCallback, cb)
}
