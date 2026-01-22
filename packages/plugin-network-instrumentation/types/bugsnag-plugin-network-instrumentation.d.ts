import { Plugin, Request, Response } from '@bugsnag/core'

/**
 * Represents a range of HTTP status codes.
 * Inclusive of minimum and maximum value.
 */
export interface HttpErrorRange {
  min: number
  max: number
}

export interface HttpErrorCallbackInfo {
  request: Request
  response: Response
}

export interface BugsnagPluginHttpErrorsConfiguration {
  /**
   * HTTP status codes to capture. Can be:
   * - A single number (e.g., 404)
   * - A range object with min/max (e.g., { min: 400, max: 499 })
   * - An array of numbers and/or ranges (e.g., [404, { min: 500, max: 599 }])
   * @default [{ min: 400, max: 599 }]
   */
  httpErrorCodes?: number | HttpErrorRange | Array<number | HttpErrorRange>

  /**
   * Maximum size in bytes of the request body to capture
   * Disabled as default
   * @default 0
   */
  maxRequestSize?: number

  /**
   * Maximum size in bytes of the response body to capture
   * Does not capture streaming responses, such as a
   * fetch request with a ReadableStream body
   * Disabled as default
   * @default 0
   */
  maxResponseSize?: number

  /**
   * Callback function to intercept HTTP errors before they are reported.
   * Return false to prevent the error from being reported.
   * You can modify the request and response objects directly.
   * @param info - Object containing request and response information
   * @returns false to prevent reporting, or void/true to continue
   */
  onHttpError?: (info: HttpErrorCallbackInfo) => boolean | void
}

declare function BugsnagPluginHttpErrors(
  config?: BugsnagPluginHttpErrorsConfiguration
): Plugin

export default BugsnagPluginHttpErrors
