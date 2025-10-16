const listOfFunctions = (value: unknown): boolean => typeof value === 'function' || (Array.isArray(value) && value.filter(f => typeof f === 'function').length === value.length)

export default listOfFunctions
