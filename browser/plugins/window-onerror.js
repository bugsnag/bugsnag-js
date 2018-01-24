/*
 * Automatically notifies Bugsnag when window.onerror is called
 */

module.exports = {
  init: (client) => {
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
        if (error.name && error.message) {
          report = new client.BugsnagReport(error.name, error.message, decorateStack(client.BugsnagReport.getStacktrace(error), url, lineNo, charNo), handledState)
        } else {
          report = new client.BugsnagReport('window.onerror', String(error), decorateStack(client.BugsnagReport.getStacktrace(error, 1), url, lineNo, charNo), handledState)
          report.updateMetaData('window onerror', { error })
        }
      } else if ((typeof messageOrEvent === 'object' && messageOrEvent !== null) && !url && !lineNo && !charNo && !error) {
        const name = messageOrEvent.type ? `Event: ${messageOrEvent.type}` : 'window.onerror'
        const message = messageOrEvent.message || messageOrEvent.detail || ''
        report = new client.BugsnagReport(name, message, client.BugsnagReport.getStacktrace(new Error(), 1).slice(1), handledState)
        report.updateMetaData('window onerror', { event: messageOrEvent })
      } else {
        report = new client.BugsnagReport('window.onerror', String(messageOrEvent), decorateStack(client.BugsnagReport.getStacktrace(error, 1), url, lineNo, charNo), handledState)
        report.updateMetaData('window onerror', { event: messageOrEvent })
      }

      client.notify(report)

      if (typeof prevOnError === 'function') prevOnError(messageOrEvent, url, lineNo, charNo, error)
    }

    const prevOnError = window.onerror
    window.onerror = onerror
  }
}

const decorateStack = (stack, url, lineNo, charNo) => {
  const culprit = stack[0]
  if (!culprit) return stack
  if (!culprit.fileName) culprit.setFileName(url)
  if (!culprit.lineNumber) culprit.setLineNumber(lineNo)
  if (!culprit.columnNumber) {
    if (charNo !== undefined) {
      culprit.setColumnNumber(charNo)
    } else if (window.event && window.event.errorCharacter) {
      culprit.setColumnNumber(window.event && window.event.errorCharacter)
    }
  }
  return stack
}
