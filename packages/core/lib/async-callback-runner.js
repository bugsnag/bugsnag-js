module.exports = (event, onCallbackError) => (fn, cb) => {
  if (typeof fn !== 'function') return cb(null, false)
  try {
    // if function appears sync…
    if (fn.length !== 2) {
      const ret = fn(event)
      // check if it returned a "thenable" (promise)
      if (ret && typeof ret.then === 'function') {
        return ret.then(
          // resolve
          val => setTimeout(() => cb(null, shouldPreventSend(val)), 0),
          // reject
          err => {
            setTimeout(() => {
              onCallbackError(err)
              return cb(null, false)
            })
          }
        )
      }
      return cb(null, shouldPreventSend(ret))
    }
    // if function is async…
    fn(event, (err, result) => {
      if (err) {
        onCallbackError(err)
        return cb(null, false)
      }
      cb(null, shouldPreventSend(result))
    })
  } catch (e) {
    onCallbackError(e)
    cb(null, false)
  }
}

// the "return" value has to explicitly be "false" – undefined, null etc. do
// not prevent the event from being sent
const shouldPreventSend = value => value === false
