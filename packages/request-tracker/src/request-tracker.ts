export interface RequestStartContext {
  url: string
  method: string
  startTime: number
  type: 'xmlhttprequest' | 'fetch'
  body?: unknown
  headers?: Record<string, string>
  input?: RequestInfo | URL
}

export interface RequestEndContext {
  endTime: number
  status?: number
  state: 'success' | 'error'
  headers?: Record<string, string>
  body?: string
  error?: unknown
}

export interface StartCallbackResult {
  onRequestEnd?: (context: RequestEndContext) => void
  extraRequestHeaders?: Record<string, string>
}

export type StartCallback = (context: RequestStartContext) => StartCallbackResult | null

export interface StartResult {
  onRequestEnd: (context: RequestEndContext) => void
  extraRequestHeaders: Record<string, string>
}

export default class RequestTracker {
  callbacks: StartCallback[] = []
  _restore?: () => void

  onStart (callback: StartCallback) {
    if (typeof callback !== 'function') {
      throw new Error('RequestTracker onStart callback must be a function')
    }
    this.callbacks.push(callback)
  }

  start (context: RequestStartContext): StartResult {
    const results = this.callbacks
      .map(callback => {
        try {
          return callback(context)
        } catch (error) {
          console.error('RequestTracker callback error:', error)
          return null
        }
      })
      .filter((result): result is StartCallbackResult => result !== null && typeof result === 'object')

    return {
      onRequestEnd: (endContext: RequestEndContext) => {
        results.forEach(result => {
          if (typeof result.onRequestEnd === 'function') {
            try {
              result.onRequestEnd(endContext)
            } catch (error) {
              console.error('RequestTracker onRequestEnd callback error:', error)
            }
          }
        })
      },
      extraRequestHeaders: results
        .map(result => result.extraRequestHeaders)
        .filter((headers): headers is Record<string, string> => headers !== null && headers !== undefined && typeof headers === 'object')
        .reduce((combined, headers) => Object.assign(combined, headers), {})
    }
  }

  _reset () {
    this.callbacks = []
  }
}
