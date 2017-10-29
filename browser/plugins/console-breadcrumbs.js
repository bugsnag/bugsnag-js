const { map, filter } = require('../../base/lib/es-utils')

/*
 * Leaves breadcrumbs when console log methods are called
 */
module.exports = {
  init: (client, BugsnagReport, BugsnagBreadcrumb) => {
    map(CONSOLE_LOG_METHODS, method => {
      const original = console[method]
      console[method] = (...args) => {
        client.leaveBreadcrumb(new BugsnagBreadcrumb('log', 'Console output', {
          severity: /^group/.test(method) ? 'log' : method,
          message: map(args, arg => {
            // do the best/simplest stringification of each argument
            let stringified = arg.toString()
            // unless it stringifies to [object Object], use the toString() value
            if (stringified !== '[object Object]') return stringified
            // otherwise attempt to JSON stringify (with indents/spaces)
            try { stringified = JSON.stringify(arg, null, 2) } catch (e) {}
            // any errors, fallback to [object Object]
            return stringified
          }).join('\n')
        }))
        console[method]._restore = () => { console[method] = original }
        original.apply(console, args)
      }
    })
  },
  destroy: () => CONSOLE_LOG_METHODS.forEach(method => {
    if (typeof console[method]._restore === 'function') console[method]._restore()
  })
}

const CONSOLE_LOG_METHODS = filter([ 'log', 'debug', 'info', 'warn', 'error' ], method =>
  typeof console !== 'undefined' && typeof console[method] === 'function'
)
