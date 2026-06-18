/**
 * Check if a status code should be captured
 * @param codes - Array of HTTP status codes or ranges
 * @param statusCode - HTTP status code
 * @returns True if should be captured
 */
export type StatusCodeRange = { min: number; max: number };
export type StatusCodeSpecifier = number | StatusCodeRange;

export function shouldCaptureStatusCode(codes: StatusCodeSpecifier[], statusCode: number): boolean {
  return codes.some(code => {
    if (typeof code === 'number') {
      return code === statusCode;
    }
    if (code && typeof code === 'object' && 'min' in code && 'max' in code) {
      return statusCode >= code.min && statusCode <= code.max;
    }
    return false;
  });
}
