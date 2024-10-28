import { Plugin } from '@bugsnag/core'
import filter from '@bugsnag/core/lib/es-utils/filter'
import map from '@bugsnag/core/lib/es-utils/map'
import reduce from '@bugsnag/core/lib/es-utils/reduce'

/*
 * Leaves breadcrumbs when console log methods are called
 */
const plugin: Plugin = {
  load: client => {
    // @ts-expect-error _config is private API
    const isDev = /^(local-)?dev(elopment)?$/.test(client._config.releaseStage)

    // @ts-expect-error isBreadcrumbTypeEnabled is private API
    if (isDev || !client._isBreadcrumbTypeEnabled('log')) return

    map(CONSOLE_LOG_METHODS, method => {
      const original = (console as any)[method]
      console[method] = (...args: any[]) => {
        client.leaveBreadcrumb(
          'Console output',
          reduce(
            args,
            (accum: any, arg: any, i: any) => {
              // do the best/simplest stringification of each argument
              let stringified = '[Unknown value]'
              // this may fail if the input is:
              // - an object whose [[Prototype]] is null (no toString)
              // - an object with a broken toString or @@toPrimitive implementation
              try {
                stringified = String(arg)
              } catch (e) {}
              // if it stringifies to [object Object] attempt to JSON stringify
              if (stringified === '[object Object]') {
                // catch stringify errors and fallback to [object Object]
                try {
                  stringified = JSON.stringify(arg)
                } catch (e) {}
              }
              accum[`[${i}]`] = stringified
              return accum
            },
            {
              severity: method.indexOf('group') === 0 ? 'log' : method
            }
          ),
          'log'
        )
        original.apply(console, args)
      }
      (console as any)[method]._restore = () => {
        (console as any)[method] = original
      }
    })
  }
}

if (process.env.NODE_ENV !== 'production') {
  plugin.destroy = () =>
    CONSOLE_LOG_METHODS.forEach(method => {
      if (typeof (console as any)[method]._restore === 'function') {
        (console as any)[method]._restore()
      }
    })
}

const CONSOLE_LOG_METHODS = filter(
  ['log', 'debug', 'info', 'warn', 'error'],
  method =>
    typeof console !== 'undefined' && typeof (console as any)[method] === 'function'
)

export default plugin
