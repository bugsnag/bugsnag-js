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
      // Ignore errors with no info due to CORS settings
      if (lineNo === 0 && /Script error\.?/.test(messageOrEvent)) {
        client._logger.warn('Ignoring cross-domain or eval script error. See https://docs.bugsnag.com/platforms/browsers/faq/#3-cross-origin-script-errors')
        return
      }

      // any error sent to window.onerror is unhandled and has severity=error
      const handledState = { severity: 'error', unhandled: true, severityReason: { type: 'unhandledException' } }

      let report
      if (error) {
        report = new BugsnagReport(error.name, error.message, getStack(error, url, lineNo, charNo), handledState)
      } else if ((typeof messageOrEvent === 'object' && messageOrEvent !== null) && !url && !lineNo && !charNo && !error) {
        const name = messageOrEvent.type ? `Event: ${messageOrEvent.type}` : 'window.onerror'
        const message = messageOrEvent.message || messageOrEvent.detail || ''
        report = new BugsnagReport(name, message, getStack(new Error()).slice(1), handledState)
        report.updateMetaData('window onerror', { event: messageOrEvent })
      } else {
        report = new BugsnagReport('window.onerror', messageOrEvent, getStack(error, url, lineNo, charNo), handledState)
        report.updateMetaData('window onerror', { event: messageOrEvent })
      }

      client.notify(report)

      if (typeof prevOnError === 'function') prevOnError(messageOrEvent, url, lineNo, charNo, error)
    }

    const prevOnError = window.onerror
    window.onerror = onerror
  }
}

const getStack = (error, url, lineNo, charNo) => {
  if (hasStack(error)) return ErrorStackParser.parse(error)

  // no error was provided, or couldn't get a stack from an error
  // so try to figure out the stack by building a stacktrace
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
