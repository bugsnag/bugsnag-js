const stringWithLength = (value: unknown): boolean => typeof value === 'string' && !!value.length

export default stringWithLength