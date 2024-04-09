const isMain = typeof process !== 'undefined' && process.type === 'browser'

const Bugsnag = isMain ? require('./client/main') : require('./client/renderer')

// commonjs
module.exports = Bugsnag

// ESM
module.exports.default = Bugsnag
