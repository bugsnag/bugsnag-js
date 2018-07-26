module.exports = (report, onError) => (fn, cb) => {
  if (typeof fn !== 'function') return cb(null, false)
  try {
    // if function appears sync…
    if (fn.length !== 2) {
      const ret = fn(report)
      // check if it returned a "thenable" (promise)
      if (ret && typeof ret.then === 'function') {
        return ret.then(
          // resolve
          val => setTimeout(() => cb(null, shouldPreventSend(report, val)), 0),
          // reject
          err => {
            setTimeout(() => {
              onError(err)
              return cb(null, false)
            })
          }
        )
      }
      return cb(null, shouldPreventSend(report, ret))
    }
    // if function is async…
    fn(report, (err, result) => {
      if (err) {
        onError(err)
        return cb(null, false)
      }
      cb(null, shouldPreventSend(report, result))
    })
  } catch (e) {
    onError(e)
    cb(null, false)
  }
}

const shouldPreventSend = (report, value) => report.isIgnored() || value === false
