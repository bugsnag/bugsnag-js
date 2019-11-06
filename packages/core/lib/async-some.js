// This is a heavily modified/simplified version of
//   https://github.com/othiym23/async-some
//
// We can't use that because:
//   a) it inflates the bundle size to over 10kB
//   b) it depends on a module that uses Object.keys()
//      (which we can't use due to ie8 support)

// run the asynchronous test function (fn) over each item in the array (arr)
// in series until:
//   - fn(item, cb) => calls cb(null, true)
//   - or the end of the array is reached
// the callback (cb) will be passed true if any of the items resulted in a true
// callback, otherwise false
module.exports = (arr, fn, cb) => {
  const length = arr.length
  let index = 0

  const next = () => {
    if (index >= length) return setTimeout(() => cb(null, false))
    fn(arr[index], (err, result) => {
      if (err) return cb(err, false)
      if (result === true) return setTimeout(() => cb(null, true))
      index++
      next()
    })
  }

  next()
}
