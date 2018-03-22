/**
 given an object with method called 'method', will let you replace the method with a newMethod.
 When object.method is called, the newMethod will be called followed by the oldMethod
 This function also returns a function that will restore the orginal method on the patched object
 @param {object} object The object to be patched
 @param {string} methodName name of the method to replace
 @param {function} newMethod New method that replaces the original
*/
module.exports = (object, methodName, newMethod) => {
  let oldMethod = object[methodName]
  object[methodName] = (...args) => {
    newMethod.apply(object, args)
    if (typeof oldMethod === 'function') {
      oldMethod.apply(object, args)
    }
  }

  let restore = () => {
    object[methodName] = oldMethod
  }

  return restore
}
