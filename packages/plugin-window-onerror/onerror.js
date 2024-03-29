/*
 * Automatically notifies Bugsnag when window.onerror is called
 */

module.exports = (win = window, component = 'window onerror') => ({
  load: (client) => {
    if (!client._config.autoDetectErrors) return
    if (!client._config.enabledErrorTypes.unhandledExceptions) return
    function onerror (messageOrEvent, url, lineNo, charNo, error) {
      // Ignore errors with no info due to CORS settings
      if (lineNo === 0 && /Script error\.?/.test(messageOrEvent)) {
        client._logger.warn('Ignoring cross-domain or eval script error. See docs: https://tinyurl.com/yy3rn63z')
      } else {
        // any error sent to window.onerror is unhandled and has severity=error
        const handledState = { severity: 'error', unhandled: true, severityReason: { type: 'unhandledException' } }

        let event

        // window.onerror can be called in a number of ways. This big if-else is how we
        // figure out which arguments were supplied, and what kind of values it received.

        if (error) {
          // if the last parameter (error) was supplied, this is a modern browser's
          // way of saying "this value was thrown and not caught"
          event = client.Event.create(error, true, handledState, component, 1)
          decorateStack(event.errors[0].stacktrace, url, lineNo, charNo)
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
          const name = messageOrEvent.type ? `Event: ${messageOrEvent.type}` : 'Error'
          // attempt to find a message from one of the conventional properties, but
          // default to empty string (the event will fill it with a placeholder)
          const message = messageOrEvent.message || messageOrEvent.detail || ''

          event = client.Event.create({ name, message }, true, handledState, component, 1)

          // provide the original thing onerror received – not our error-like object we passed to _notify
          event.originalError = messageOrEvent

          // include the raw input as metadata – it might contain more info than we extracted
          event.addMetadata(component, { event: messageOrEvent, extraParameters: url })
        } else {
          // Lastly, if there was no "error" parameter this event was probably from an old
          // browser that doesn't support that. Instead we need to generate a stacktrace.
          event = client.Event.create(messageOrEvent, true, handledState, component, 1)
          decorateStack(event.errors[0].stacktrace, url, lineNo, charNo)
        }

        client._notify(event)
      }

      if (typeof prevOnError === 'function') prevOnError.apply(this, arguments)
    }

    const prevOnError = win.onerror
    win.onerror = onerror
  }
})

// Sometimes the stacktrace has less information than was passed to window.onerror.
// This function will augment the first stackframe with any useful info that was
// received as arguments to the onerror callback.
const decorateStack = (stack, url, lineNo, charNo) => {
  if (!stack[0]) stack.push({})
  const culprit = stack[0]
  if (!culprit.file && typeof url === 'string') culprit.file = url
  if (!culprit.lineNumber && isActualNumber(lineNo)) culprit.lineNumber = lineNo
  if (!culprit.columnNumber) {
    if (isActualNumber(charNo)) {
      culprit.columnNumber = charNo
    } else if (window.event && isActualNumber(window.event.errorCharacter)) {
      culprit.columnNumber = window.event.errorCharacter
    }
  }
}

const isActualNumber = (n) => typeof n === 'number' && String.call(n) !== 'NaN'
