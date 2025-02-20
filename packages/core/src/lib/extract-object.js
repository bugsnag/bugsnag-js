// Given a host object, return the value at host[key] if it is an object
// and it has at least one key/value

module.exports = (host, key) => {
  if (host[key] && typeof host[key] === 'object' && Object.keys(host[key]).length > 0) {
    return host[key]
  } else {
    return undefined
  }
}
