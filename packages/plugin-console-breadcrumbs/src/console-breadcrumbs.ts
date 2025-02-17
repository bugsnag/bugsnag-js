import { Client, Config, Plugin } from '@bugsnag/core'
import filter from '@bugsnag/core/lib/es-utils/filter'
import reduce from '@bugsnag/core/lib/es-utils/reduce'

type ConsoleMethod = 'log' | 'debug' | 'info' | 'warn' | 'error'

interface ClientWithInternals extends Client {
  _config: Required<Config>
  _isBreadcrumbTypeEnabled: (type: ConsoleMethod) => boolean
}

type ConsoleWithRestore = Console & {
  [key in ConsoleMethod]: typeof console[ConsoleMethod] & { _restore: () => void }
}

/*
 * Leaves breadcrumbs when console log methods are called
 */
const plugin: Plugin = {
  load: (client) => {
    const isDev = /^(local-)?dev(elopment)?$/.test((client as ClientWithInternals)._config.releaseStage)

    if (isDev || !(client as ClientWithInternals)._isBreadcrumbTypeEnabled('log')) return

    CONSOLE_LOG_METHODS.map(method => {
      const original = console[method]
      console[method] = (...args: any) => {
        client.leaveBreadcrumb(
          'Console output',
          reduce(
            args,
            (accum, arg, i) => {
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
      (console as ConsoleWithRestore)[method]._restore = () => {
        console[method] = original
      }
    })
  }
}

if (process.env.NODE_ENV !== 'production') {
  plugin.destroy = () => {
    const consoleWithRestore = console as ConsoleWithRestore
    CONSOLE_LOG_METHODS.forEach(method => {
      if (typeof consoleWithRestore[method]._restore === 'function') {
        consoleWithRestore[method]._restore()
      }
    })
  }
}

const CONSOLE_LOG_METHODS: ConsoleMethod[] = filter(
  ['log', 'debug', 'info', 'warn', 'error'],
  method =>
    typeof console !== 'undefined' && typeof console[method] === 'function'
)

export default plugin
