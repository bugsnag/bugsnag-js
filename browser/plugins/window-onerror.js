const StackGenerator = require('stack-generator')
const ErrorStackParser = require('error-stack-parser')

module.exports = {
  name: 'window onerror',
  description: 'Automatically notifies Bugsnag when window.onerror is called',
  init: (client, BugsnagReport) => {
    const onerror = (messageOrEvent, url, lineNo, charNo, error) => {
      const handledState = { severity: 'error', unhandled: true, severityReason: { type: 'unhandledException' } }
      const report = (error && hasStacktrace(error))
        ? new BugsnagReport(error.name, error.message, ErrorStackParser.parse(error), handledState)
        : new BugsnagReport('window.onerror', messageOrEvent, generateStack(url, lineNo, charNo), handledState)
      client.notify(report)
    }

    window.onerror = onerror
  }
}

const hasStacktrace = err => err.stack || err.stacktrace || err['opera#sourceloc']

const generateStack = (url, lineNo, charNo) => {
  // no error was provided so try to figure out the stack by building a stacktrace
  try {
    const stack = StackGenerator.backtrace()
      .filter(frame => (frame.functionName || '').indexOf('StackGenerator$$') === -1)
      .slice(2) // remove this function and the onerror handler from the stack frames

    // attach some information that we do know from onerror to the first frame in the stack
    const culprit = stack[0]
    if (culprit) {
      culprit.setFileName(url)
      culprit.setLineNumber(lineNo)
      if (charNo !== undefined) culprit.setColumnNumber(charNo)
    }

    return stack
  } catch (e) {
    // got an error attempting to create stack for error
    return []
  }
}
