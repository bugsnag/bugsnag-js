// Given a host object, return the value at host[key] if it is an object
// and it has at least one key/value

const extractObject = (host: object, key: any): object | undefined => {
  if (host[key as keyof typeof host] && typeof host[key as keyof typeof host] === 'object' && Object.keys(host[key as keyof typeof host]).length > 0) {
    return host[key as keyof typeof host]
  } else {
    return undefined
  }
}

export default extractObject
