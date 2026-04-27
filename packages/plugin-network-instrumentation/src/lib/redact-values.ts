/**
 * Redact values in an object based on a list of keys
 * @param obj - The object to redact
 * @param keys - The keys to redact
 * @returns A new object with redacted values
 */
export default function redactValues<T extends Record<string, any>>(obj: T, keys: Array<keyof T>): T {
  const redacted: T = { ...obj }
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(redacted, key)) {
      redacted[key] = '[REDACTED]' as any
    }
  }
  return redacted
}