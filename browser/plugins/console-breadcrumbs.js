const { map, reduce, filter } = require('../../base/lib/es-utils')

/*
 * Leaves breadcrumbs when console log methods are called
 */
exports.init = (client) => {
  map(CONSOLE_LOG_METHODS, method => {
    const original = console[method]
    console[method] = (...args) => {
      client.leaveBreadcrumb('Console output', reduce(args, (accum, arg, i) => {
        // do the best/simplest stringification of each argument
        let stringified = String(arg)
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

exports.configSchema = {
  consoleBreadcrumbsEnabled: {
    defaultValue: () => undefined,
    validate: (value) => value === true || value === false || value === undefined,
    message: 'should be true|false'
  }
}

if (process.env.NODE_ENV !== 'production') {
  exports.destroy = () => CONSOLE_LOG_METHODS.forEach(method => {
    if (typeof console[method]._restore === 'function') console[method]._restore()
  })
}

const CONSOLE_LOG_METHODS = filter([ 'log', 'debug', 'info', 'warn', 'error' ], method =>
  typeof console !== 'undefined' && typeof console[method] === 'function'
)
