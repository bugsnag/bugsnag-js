const map = require('@bugsnag/core/lib/es-utils/map')
const reduce = require('@bugsnag/core/lib/es-utils/reduce')
const filter = require('@bugsnag/core/lib/es-utils/filter')
const includes = require('@bugsnag/core/lib/es-utils/includes')

/*
 * Leaves breadcrumbs when console log methods are called
 */
exports.load = (client) => {
  const isDev = /^dev(elopment)?$/.test(client._config.releaseStage)

  if (!client._config.enabledBreadcrumbTypes || !includes(client._config.enabledBreadcrumbTypes, 'log') || isDev) return

  map(CONSOLE_LOG_METHODS, method => {
    const original = console[method]
    console[method] = (...args) => {
      client.leaveBreadcrumb('Console output', reduce(args, (accum, arg, i) => {
        // do the best/simplest stringification of each argument
        let stringified = '[Unknown value]'
        // this may fail if the input is:
        // - an object whose [[Prototype]] is null (no toString)
        // - an object with a broken toString or @@toPrimitive implementation
        try { stringified = String(arg) } catch (e) {}
        // if it stringifies to [object Object] attempt to JSON stringify
        if (stringified === '[object Object]') {
          // catch stringify errors and fallback to [object Object]
          try { stringified = JSON.stringify(arg) } catch (e) {}
        }
        accum[`[${i}]`] = stringified
        return accum
      }, {
        severity: method.indexOf('group') === 0 ? 'log' : method
      }), 'log')
      original.apply(console, args)
    }
    console[method]._restore = () => { console[method] = original }
  })
}

if (process.env.NODE_ENV !== 'production') {
  exports.destroy = () => CONSOLE_LOG_METHODS.forEach(method => {
    if (typeof console[method]._restore === 'function') console[method]._restore()
  })
}

const CONSOLE_LOG_METHODS = filter(['log', 'debug', 'info', 'warn', 'error'], method =>
  typeof console !== 'undefined' && typeof console[method] === 'function'
)
