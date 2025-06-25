const isArray = require('../es-utils/is-array')

module.exports = value => typeof value === 'function' || (isArray(value) && value.filter(f => typeof f === 'function').length === value.length)
