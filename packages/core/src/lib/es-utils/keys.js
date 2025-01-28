/* eslint-disable-next-line no-prototype-builtins */
const _hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString')
const _dontEnums = [
  'toString', 'toLocaleString', 'valueOf', 'hasOwnProperty',
  'isPrototypeOf', 'propertyIsEnumerable', 'constructor'
]

// Object#keys
module.exports = obj => {
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
