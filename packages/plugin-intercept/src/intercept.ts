import type { Plugin } from '@bugsnag/core'
import { nodeFallbackStack } from '@bugsnag/core'

type ErrorCallback = () => void
type SuccessCallback<T extends unknown[]> = (...args: T) => void
type NodeCallback<T extends unknown[]> = (err: Error | null, ...data: T) => void

interface InterceptFunction {
  // Single callback (no error handler)
  <T extends unknown[]>(cb: SuccessCallback<T>): NodeCallback<T>
  // Error handler + callback
  <T extends unknown[]>(onError: ErrorCallback, cb: SuccessCallback<T>): NodeCallback<T>
}

const plugin: Plugin = {
  name: 'intercept',
  load: client => {
    const intercept: InterceptFunction = <T extends unknown[]>(
      onError: ErrorCallback | SuccessCallback<T> = () => {},
      cb?: SuccessCallback<T>
    ): NodeCallback<T> => {
      if (typeof cb !== 'function') {
        // Single-parameter form: intercept(cb)
        cb = onError as SuccessCallback<T>
        onError = () => {}
      }

      // capture a stacktrace in case a resulting error has nothing
      const fallbackStack = nodeFallbackStack.getStack()

      return (err: Error | null, ...data: T) => {
        if (err) {
          // check if the stacktrace has no context, if so, if so append the frames we created earlier
          if (typeof err.stack === 'string' && fallbackStack) {
            nodeFallbackStack.maybeUseFallbackStack(err, fallbackStack)
          }
          const event = client.Event.create(err, true, {
            severity: 'warning',
            unhandled: false,
            severityReason: { type: 'callbackErrorIntercept' }
          }, 'intercept()', 1)
          client._notify(event, onError as ErrorCallback)
          return
        }
        cb(...data)
      }
    }

    return intercept
  }
}

export default plugin
