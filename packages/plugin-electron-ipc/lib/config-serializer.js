const DO_NOT_SERIALIZE = ['logger', 'plugins']
const jsonStringify = require('@bugsnag/safe-json-stringify')

module.exports = (config) => jsonStringify(Object.keys(config).reduce((accum, k) => {
  if (!DO_NOT_SERIALIZE.includes(k)) return { ...accum, [k]: config[k] }
  return accum
}, {}))
