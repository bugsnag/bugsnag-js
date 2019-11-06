const ErrorStackParser = require('./lib/error-stack-parser')
const StackGenerator = require('stack-generator')
const hasStack = require('./lib/has-stack')
const { reduce, filter, map } = require('./lib/es-utils')
const jsRuntime = require('./lib/js-runtime')
const metadataDelegate = require('./lib/metadata-delegate')

class Event {
  constructor (errorClass, errorMessage, stacktrace = [], originalError, handledState = defaultHandledState()) {
    this.apiKey = undefined
    this.context = undefined
    this.groupingHash = undefined
    this.originalError = originalError

    this._handledState = handledState
    this.severity = handledState.severity
    this.unhandled = this._handledState.unhandled

    this.app = {}
    this.device = {}
    this.request = {}

    this._metadata = {}
    this._user = {}

    this.breadcrumbs = []

    this._session = undefined

    this.errors = [
      {
        errorClass: stringOrFallback(errorClass, '[no error class]'),
        errorMessage: stringOrFallback(errorMessage, '[no error message]'),
        type: jsRuntime,
        stacktrace: reduce(stacktrace, (accum, frame) => {
          const f = formatStackframe(frame)
          // don't include a stackframe if none of its properties are defined
          try {
            if (JSON.stringify(f) === '{}') return accum
            return accum.concat(f)
          } catch (e) {
            return accum
          }
        }, [])
      }
    ]

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
      exceptions: map(this.errors, er => ({ ...er, message: er.errorMessage })),
      severity: this.severity,
      unhandled: this._handledState.unhandled,
      severityReason: this._handledState.severityReason,
      breadcrumbs: this.breadcrumbs,
      metaData: this._metadata,
      session: this._session,
      user: this._user,
      context: this.context,
      groupingHash: this.groupingHash,
      app: this.app,
      device: this.device,
      request: this.request
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

Event.getStacktrace = function (error, errorFramesToSkip = 0, generatedFramesToSkip = 0) {
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

module.exports = Event
