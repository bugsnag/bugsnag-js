// Array#reduce
module.exports = (arr, fn, accum) => {
  let val = accum
  for (let i = 0, len = arr.length; i < len; i++) val = fn(val, arr[i], i, arr)
  return val
}
