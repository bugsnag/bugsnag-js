// This is a heavily modified/simplified version of
//   https://github.com/othiym23/async-some
// with the logic flipped so that it is akin to the
// synchronous "every" method instead of "some".

// run the asynchronous test function (fn) over each item in the array (arr)
// in series until:
//   - fn(item, cb) => calls cb(null, false)
//   - or the end of the array is reached
// the callback (cb) will be passed (null, false) if any of the items in arr
// caused fn to call back with false, otherwise it will be passed (null, true)
module.exports = (arr, fn, cb) => {
  let index = 0

  const next = () => {
    if (index >= arr.length) return cb(null, true)
    fn(arr[index], (err, result) => {
      if (err) return cb(err)
      if (result === false) return cb(null, false)
      index++
      next()
    })
  }

  next()
}
