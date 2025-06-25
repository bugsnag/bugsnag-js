import isArray from '../es-utils/is-array'

const listOfFunctions = (value: unknown): boolean => typeof value === 'function' || (isArray(value) && value.filter(f => typeof f === 'function').length === value.length)

export default listOfFunctions
