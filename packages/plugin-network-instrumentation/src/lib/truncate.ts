/**
 * Truncate a string to a maximum length, adding "..." if truncated
 * @param value - The string to truncate
 * @param maxLength - The maximum length
 * @returns The truncated string
 */
export default function truncate(value: string, maxLength: number): string {
  if (typeof value !== 'string') return value
  if (value.length <= maxLength) return value
  return value.slice(0, maxLength) + '...'
}