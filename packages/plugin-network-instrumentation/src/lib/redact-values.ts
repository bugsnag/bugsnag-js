/**
 * Redact values in an object based on a list of keys or patterns
 * @param obj - The object to redact
 * @param keys - The keys or patterns to redact
 * @returns A new object with redacted values
 */
export default function redactValues<T extends Record<string, any>>(obj: T, keys: (string | RegExp)[]): T {
  const redacted: Record<string, any> = { ...obj }
  for (const key of Object.keys(redacted)) {
    for (const pattern of keys) {
      if (
        (typeof pattern === 'string' && key === pattern) ||
        (pattern instanceof RegExp && pattern.test(key))
      ) {
        redacted[key] = '[REDACTED]'
        break
      }
    }
  }
  return redacted as T
}