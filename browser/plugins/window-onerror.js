const StackGenerator = require('stack-generator')
const ErrorStackParser = require('error-stack-parser')
const hasStack = require('../../base/lib/has-stack')
const { filter } = require('../../base/lib/es-utils')

/*
 * Automatically notifies Bugsnag when window.onerror is called
 */

module.exports = {
  init: (client, BugsnagReport) => {
    const onerror = (messageOrEvent, url, lineNo, charNo, error) => {
      const handledState = { severity: 'error', unhandled: true, severityReason: { type: 'unhandledException' } }

      let name, message
      if ((typeof messageOrEvent === 'object' && messageOrEvent !== null) && !url && !lineNo && !charNo && !error) {
        name = 'Event: error'
        message = messageOrEvent.message || messageOrEvent.detail
      } else if (error) {
        name = error.name
        message = error.message
      } else {
        name = 'window.onerror'
        message = messageOrEvent
      }

      if (lineNo === 0 && /Script error\.?/.test(message)) {
        client._logger.warn('Ignoring cross-domain or eval script error. See https://docs.bugsnag.com/platforms/browsers/faq/#3-cross-origin-script-errors')
        return
      }

      const report = hasStack(error)
        ? new BugsnagReport(name, message, ErrorStackParser.parse(error), handledState)
        : new BugsnagReport(name, message, generateStack(url, lineNo, charNo), handledState)

      client.notify(report)

      if (typeof prevOnError === 'function') prevOnError(messageOrEvent, url, lineNo, charNo, error)
    }

    const prevOnError = window.onerror
    window.onerror = onerror
  }
}

const generateStack = (url, lineNo, charNo) => {
  // no error was provided so try to figure out the stack by building a stacktrace
  try {
    const stack = filter(StackGenerator.backtrace(), frame => (frame.functionName || '').indexOf('StackGenerator$$') === -1)
      .slice(1) // remove this function and the onerror handler stack frames

    // attach some information that we do know from onerror to the first frame in the stack
    const culprit = stack[0]
    if (culprit) {
      culprit.setFileName(url)
      culprit.setLineNumber(lineNo)
      if (charNo !== undefined) {
        culprit.setColumnNumber(charNo)
      } else if (window.event && window.event.errorCharacter) {
        culprit.setColumnNumber(window.event && window.event.errorCharacter)
      }
    }
    return stack
  } catch (e) {
    // got an error attempting to create stack for error
    // console.log(e.name, e.message, e.stack)
    return []
  }
}
