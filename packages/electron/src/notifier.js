const isMain = typeof process !== 'undefined' && process.type === 'browser'

const Bugsnag = isMain ? require('./main') : require('./renderer')

// commonjs
module.exports = Bugsnag

// ESM
module.exports.default = Bugsnag
