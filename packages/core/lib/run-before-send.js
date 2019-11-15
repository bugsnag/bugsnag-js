module.exports = (event, onError) => (fn, cb) => {
  if (typeof fn !== 'function') return cb(null, false)
  try {
    // if function appears sync…
    if (fn.length !== 2) {
      const ret = fn(event)
      // check if it returned a "thenable" (promise)
      if (ret && typeof ret.then === 'function') {
        return ret.then(
          // resolve
          val => setTimeout(() => cb(null, shouldPreventSend(event, val)), 0),
          // reject
          err => {
            setTimeout(() => {
              onError(err)
              return cb(null, false)
            })
          }
        )
      }
      return cb(null, shouldPreventSend(event, ret))
    }
    // if function is async…
    fn(event, (err, result) => {
      if (err) {
        onError(err)
        return cb(null, false)
      }
      cb(null, shouldPreventSend(event, result))
    })
  } catch (e) {
    onError(e)
    cb(null, false)
  }
}

const shouldPreventSend = (event, value) => event.isIgnored() || value === false
