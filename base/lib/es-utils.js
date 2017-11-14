// minimal implementations of useful ES functionality

// all we really need for arrays is reduce – everything else is just sugar!

// Array#reduce
const reduce = (arr, fn, accum) => {
  let val = accum
  for (let i = 0, len = arr.length; i < len; i++) val = fn(val, arr[i], i, arr)
  return val
}

// Array#filter
const filter = (arr, fn) =>
  reduce(arr, (accum, item, i, arr) => !fn(item, i, arr) ? accum : accum.concat(item), [])

// Array#map
const map = (arr, fn) =>
  reduce(arr, (accum, item, i, arr) => accum.concat(fn(item, i, arr)), [])

// Array#includes
const includes = (arr, x) =>
  reduce(arr, (accum, item, i, arr) => accum === true || item === x, false)

const _hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString')
const _dontEnums = [
  'toString', 'toLocaleString', 'valueOf', 'hasOwnProperty',
  'isPrototypeOf', 'propertyIsEnumerable', 'constructor'
]

// Object#keys
const keys = obj => {
  // stripped down version of
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/Keys
  const result = []
  let prop
  for (prop in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, prop)) result.push(prop)
  }
  if (!_hasDontEnumBug) return result
  for (let i = 0, len = _dontEnums.length; i < len; i++) {
    if (Object.prototype.hasOwnProperty.call(obj, _dontEnums[i])) result.push(_dontEnums[i])
  }
  return result
}

// Array#isArray
const isArray = obj => Object.prototype.toString.call(obj) === '[object Array]'

const _pad = n => n < 10 ? `0${n}` : n

// Date#toISOString
const isoDate = () => {
  // from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
  const d = new Date()
  return d.getUTCFullYear() +
    '-' + _pad(d.getUTCMonth() + 1) +
    '-' + _pad(d.getUTCDate()) +
    'T' + _pad(d.getUTCHours()) +
    ':' + _pad(d.getUTCMinutes()) +
    ':' + _pad(d.getUTCSeconds()) +
    '.' + (d.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5) +
    'Z'
}

module.exports = { map, reduce, filter, includes, keys, isArray, isoDate }
