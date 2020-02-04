const { filter, isArray } = require('../es-utils')

module.exports = value => typeof value === 'function' || (isArray(value) && filter(value, f => typeof f === 'function').length === value.length)
