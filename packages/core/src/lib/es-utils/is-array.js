// Array#isArray
module.exports = obj => Object.prototype.toString.call(obj) === '[object Array]'
