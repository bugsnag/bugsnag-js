const ErrorStackParser = require('./lib/error-stack-parser')
const StackGenerator = require('stack-generator')
const hasStack = require('./lib/has-stack')
const { reduce, filter } = require('./lib/es-utils')
const jsRuntime = require('./lib/js-runtime')
const metadataDelegate = require('./lib/metadata-delegate')

class BugsnagEvent {
  constructor (errorClass, errorMessage, stacktrace = [], handledState = defaultHandledState(), originalError) {
    // duck-typing ftw >_<
    this.__isBugsnagEvent = true

    // private (un)handled state
    this._handledState = handledState

    // setable props
    this.app = undefined
    this.apiKey = undefined
    this.breadcrumbs = []
    this.context = undefined
    this.device = undefined
    this.errorClass = stringOrFallback(errorClass, '[no error class]')
    this.errorMessage = stringOrFallback(errorMessage, '[no error message]')
    this.groupingHash = undefined
    this._metadata = {}
    this.request = undefined
    this.severity = this._handledState.severity
    this.stacktrace = reduce(stacktrace, (accum, frame) => {
      const f = formatStackframe(frame)
      // don't include a stackframe if none of its properties are defined
      try {
        if (JSON.stringify(f) === '{}') return accum
        return accum.concat(f)
      } catch (e) {
        return accum
      }
    }, [])
    this._user = {}
    this.session = undefined
    this.originalError = originalError

    // Flags.
    // Note these are not initialised unless they are used
    // to save unnecessary bytes in the browser bundle

    /* this.attemptImmediateDelivery, default: true */
  }

  addMetadata (section, ...args) {
    return metadataDelegate.add.call(this, section, ...args)
  }

  getMetadata (section, key) {
    return metadataDelegate.get.call(this, section, key)
  }

  clearMetadata (section, key) {
    return metadataDelegate.clear.call(this, section, key)
  }

  getUser () {
    return this._user
  }

  setUser (id, email, name) {
    this._user = { id, email, name }
  }

  toJSON () {
    return {
      payloadVersion: '4',
      exceptions: [
        {
          errorClass: this.errorClass,
          message: this.errorMessage,
          stacktrace: this.stacktrace,
          type: jsRuntime
        }
      ],
      severity: this.severity,
      unhandled: this._handledState.unhandled,
      severityReason: this._handledState.severityReason,
      app: this.app,
      device: this.device,
      breadcrumbs: this.breadcrumbs,
      context: this.context,
      metaData: this._metadata,
      user: this._user,
      groupingHash: this.groupingHash,
      request: this.request,
      session: this.session
    }
  }
}

// takes a stacktrace.js style stackframe (https://github.com/stacktracejs/stackframe)
// and returns a Bugsnag compatible stackframe (https://docs.bugsnag.com/api/error-reporting/#json-payload)
const formatStackframe = frame => {
  const f = {
    file: frame.fileName,
    method: normaliseFunctionName(frame.functionName),
    lineNumber: frame.lineNumber,
    columnNumber: frame.columnNumber,
    code: undefined,
    inProject: undefined
  }
  // Some instances result in no file:
  // - calling notify() from chrome's terminal results in no file/method.
  // - non-error exception thrown from global code in FF
  // This adds one.
  if (f.lineNumber > -1 && !f.file && !f.method) {
    f.file = 'global code'
  }
  return f
}

const normaliseFunctionName = name => /^global code$/i.test(name) ? 'global code' : name

const defaultHandledState = () => ({
  unhandled: false,
  severity: 'warning',
  severityReason: { type: 'handledException' }
})

const stringOrFallback = (str, fallback) => typeof str === 'string' && str ? str : fallback

// Helpers

BugsnagEvent.getStacktrace = function (error, errorFramesToSkip = 0, generatedFramesToSkip = 0) {
  if (hasStack(error)) return ErrorStackParser.parse(error).slice(errorFramesToSkip)
  // in IE11 a new Error() doesn't have a stacktrace until you throw it, so try that here
  try {
    throw error
  } catch (e) {
    if (hasStack(e)) return ErrorStackParser.parse(error).slice(1 + generatedFramesToSkip)
    // error wasn't provided or didn't have a stacktrace so try to walk the callstack
    try {
      return filter(StackGenerator.backtrace(), frame =>
        (frame.functionName || '').indexOf('StackGenerator$$') === -1
      ).slice(1 + generatedFramesToSkip)
    } catch (e) {
      return []
    }
  }
}

BugsnagEvent.ensureEvent = function (eventOrError, errorFramesToSkip = 0, generatedFramesToSkip = 0) {
  // notify() can be called with an Event object. In this case no action is required
  if (eventOrError.__isBugsnagEvent) return eventOrError
  try {
    const stacktrace = BugsnagEvent.getStacktrace(eventOrError, errorFramesToSkip, 1 + generatedFramesToSkip)
    return new BugsnagEvent(eventOrError.name, eventOrError.message, stacktrace, undefined, eventOrError)
  } catch (e) {
    return new BugsnagEvent(eventOrError.name, eventOrError.message, [], undefined, eventOrError)
  }
}

module.exports = BugsnagEvent
