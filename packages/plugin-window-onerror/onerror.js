/*
 * Automatically notifies Bugsnag when window.onerror is called
 */

module.exports = {
  init: (client, win = window) => {
    function onerror (messageOrEvent, url, lineNo, charNo, error) {
      // Ignore errors with no info due to CORS settings
      if (lineNo === 0 && /Script error\.?/.test(messageOrEvent)) {
        client._logger.warn('Ignoring cross-domain or eval script error. See docs: https://tinyurl.com/y94fq5zm')
      } else {
        // any error sent to window.onerror is unhandled and has severity=error
        const handledState = { severity: 'error', unhandled: true, severityReason: { type: 'unhandledException' } }

        let report

        // window.onerror can be called in a number of ways. This big if-else is how we
        // figure out which arguments were supplied, and what kind of values it received.

        if (error) {
          // if the last parameter (error) was supplied, this is a modern browser's
          // way of saying "this value was thrown and not caught"

          if (error.name && error.message) {
            // if it looks like an error, construct a report object using its stack
            report = new client.BugsnagReport(
              error.name,
              error.message,
              decorateStack(client.BugsnagReport.getStacktrace(error), url, lineNo, charNo),
              handledState
            )
          } else {
            // otherwise, for non error values that were thrown, stringify it for
            // use as the error message and get/generate a stacktrace
            report = new client.BugsnagReport(
              'window.onerror',
              String(error),
              decorateStack(client.BugsnagReport.getStacktrace(error, 1), url, lineNo, charNo),
              handledState
            )
            // include the raw input as metadata
            report.updateMetaData('window onerror', { error })
          }
        } else if (
          // This complex case detects "error" events that are typically synthesised
          // by jquery's trigger method (although can be created in other ways). In
          // order to detect this:
          // - the first argument (message) must exist and be an object (most likely it's a jQuery event)
          // - the second argument (url) must either not exist or be something other than a string (if it
          //    exists and is not a string, it'll be the extraParameters argument from jQuery's trigger()
          //    function)
          // - the third, fourth and fifth arguments must not exist (lineNo, charNo and error)
          (typeof messageOrEvent === 'object' && messageOrEvent !== null) &&
          (!url || typeof url !== 'string') &&
          !lineNo && !charNo && !error
        ) {
          // The jQuery event may have a "type" property, if so use it as part of the error message
          const name = messageOrEvent.type ? `Event: ${messageOrEvent.type}` : 'window.onerror'
          // attempt to find a message from one of the conventional properties, but
          // default to empty string (the report will fill it with a placeholder)
          const message = messageOrEvent.message || messageOrEvent.detail || ''
          report = new client.BugsnagReport(
            name,
            message,
            client.BugsnagReport.getStacktrace(new Error(), 1).slice(1),
            handledState
          )
          // include the raw input as metadata – it might contain more info than we extracted
          report.updateMetaData('window onerror', { event: messageOrEvent, extraParameters: url })
        } else {
          // Lastly, if there was no "error" parameter this event was probably from an old
          // browser that doesn't support that. Instead we need to generate a stacktrace.
          report = new client.BugsnagReport(
            'window.onerror',
            String(messageOrEvent),
            decorateStack(client.BugsnagReport.getStacktrace(error, 1), url, lineNo, charNo),
            handledState
          )
          // include the raw input as metadata – it might contain more info than we extracted
          report.updateMetaData('window onerror', { event: messageOrEvent })
        }

        client.notify(report)
      }

      if (typeof prevOnError === 'function') prevOnError.apply(this, arguments)
    }

    const prevOnError = win.onerror
    win.onerror = onerror
  }
}

// Sometimes the stacktrace has less information than was passed to window.onerror.
// This function will augment the first stackframe with any useful info that was
// received as arguments to the onerror callback.
const decorateStack = (stack, url, lineNo, charNo) => {
  const culprit = stack[0]
  if (!culprit) return stack
  if (!culprit.fileName && typeof url === 'string') culprit.setFileName(url)
  if (!culprit.lineNumber && isActualNumber(lineNo)) culprit.setLineNumber(lineNo)
  if (!culprit.columnNumber) {
    if (isActualNumber(charNo)) {
      culprit.setColumnNumber(charNo)
    } else if (window.event && isActualNumber(window.event.errorCharacter)) {
      culprit.setColumnNumber(window.event.errorCharacter)
    }
  }
  return stack
}

const isActualNumber = (n) => typeof n === 'number' && String.call(n) !== 'NaN'
