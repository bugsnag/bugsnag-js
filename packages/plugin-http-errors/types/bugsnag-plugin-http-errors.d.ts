import { Plugin, Request, Response } from '@bugsnag/core'

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
   * Maximum size of the response body to capture (in characters)
   * @default 20000
   */
  maxResponseSize?: number

  /**
   * Maximum size of the request body to capture (in characters)
   * @default 5000
   */
  maxRequestSize?: number

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