const createReportFromErr = require('@bugsnag/core/lib/report-from-error')

module.exports = {
  name: 'intercept',
  init: client => {
    const intercept = (opts, cb = () => {}) => {
      if (typeof opts === 'function') {
        cb = opts
        opts = {}
      }

      // capture a stacktrace in case a resulting error has nothing

      // this happens with a lot of node's builtin async callbacks
      // when they return from the native layer with no context
      // for example:
      //
      //   fs.readFile('does not exist', (err) => {
      //     /* node 8 */
      //     err.stack = "ENOENT: no such file or directory, open 'nope'"
      //     /* node 4,6 */
      //     err.stack = "Error: ENOENT: no such file or directory, open 'nope'\n    at Error (native)"
      //   })

      // slice(2) removes the first line + this function's frame,
      // so the stack begins with the caller of this function
      const stack = (new Error()).stack.split('\n').slice(2).join('\n')

      return (err, ...data) => {
        if (err) {
          // check if the stacktrace no context, if so, if so append the frames we created earlier
          if (err.stack) {
            const lines = err.stack.split('\n')
            if (lines.length === 1 || (lines.length === 2 && /at Error \(native\)/.test(lines[1]))) {
              err.stack = `${lines[0]}\n${stack}`
            }
          }
          const report = createReportFromErr(err, {
            severity: 'warning',
            unhandled: false,
            severityReason: { type: 'callbackErrorIntercept' }
          })
          client.notify(report, opts)
          return
        }
        cb(...data) // eslint-disable-line
      }
    }

    return intercept
  }
}
