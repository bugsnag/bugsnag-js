const isArray = (obj: any): obj is any[] => Object.prototype.toString.call(obj) === '[object Array]'

export default isArray