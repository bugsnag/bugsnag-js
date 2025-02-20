const filter = require('../es-utils/filter')
const isArray = require('../es-utils/is-array')

module.exports = value => typeof value === 'function' || (isArray(value) && filter(value, f => typeof f === 'function').length === value.length)
