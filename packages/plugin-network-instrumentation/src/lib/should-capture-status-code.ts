/**
 * Check if a status code should be captured based on the provided ranges
 * @param codes - Array of ranges, a single range, or a single number
 * @param status - The status code to check
 * @returns True if the status code should be captured
 */
type StatusCodeRange = { min: number, max: number }
type HttpErrorCodes = Array<StatusCodeRange> | StatusCodeRange | number

export default function shouldCaptureStatusCode(
  codes: HttpErrorCodes,
  status: number
): boolean {
  const ranges = Array.isArray(codes) ? codes : [codes]
  for (const range of ranges) {
    if (typeof range === 'number') {
      if (status === range) return true
    } else if (typeof range === 'object' && range !== null) {
      if (status >= range.min && status <= range.max) return true
    }
  }
  return false
}