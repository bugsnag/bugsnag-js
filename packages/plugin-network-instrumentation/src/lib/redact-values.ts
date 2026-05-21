/**
 * Redact values in an object based on a list of keys
 * @param object - The object to redact
 * @param keys - The keys to redact
 * @returns The redacted object
 */
export function redactValues<T extends Record<string, unknown>>(object: T, keys: string[]): T {
  const lowercasedKeys = keys.map(key => key.toLowerCase());
  Object.keys(object).forEach((key) => {
    if (lowercasedKeys.includes(key.toLowerCase())) {
      (object as Record<string, unknown>)[key] = '[REDACTED]';
    }
  });
  return object;
}