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
        console.log('function appears sync', fn.toString())
        const ret = fn(event)
        // check if it returned a "thenable" (promise)
        if (ret && typeof ret.then === 'function') {
          console.log('Promise return... thening it', ret)
          const onError = err => {
            console.log('Promise.reject - setTimeout')
            setTimeout(() => {
              onCallbackError(err)
              return cb(null, true)
            }, 1)
          }
          return ret.then(
            // resolve
            val => {
              console.log('setting timeout for resolve callback')
              setTimeout(() => {
                console.log('running cb')
                try {
                  return cb(null, val)
                } catch(e) {
                  console.log('cb threw an Error', e)
                  throw e
                }
              }, 1)
            },
            // reject
            onError
          ).catch(onError)
        }
        return cb(null, ret)
      }
      // if function is async…
      console.log('function appears async')
      fn(event, (err, result) => {
        if (err) {
          onCallbackError(err)
          return cb(null)
        }
        cb(null, result)
      })
    } catch (e) {
      console.log('caught an error, heading for onCallbackError')
      onCallbackError(e)
      cb(null)
    }
  }

  some(callbacks, runMaybeAsyncCallback, cb)
}
