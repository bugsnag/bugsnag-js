const ErrorStackParser = require('./lib/error-stack-parser')
const StackGenerator = require('stack-generator')
const hasStack = require('./lib/has-stack')
const { reduce, filter, map } = require('./lib/es-utils')
const jsRuntime = require('./lib/js-runtime')
const State = require('./lib/state')
const supportDeprecatedProps = require('./lib/deprecated-prop-support')

const DEPRECATED_PROPS = [
  'app', 'device', 'context', 'user', 'request', 'metaData', 'apiKey', 'severity',
  'groupingHash', 'errorClass', 'errorMessage', 'breadcrumbs', 'stacktrace'
]

class BugsnagReport {
  constructor (errorClass, errorMessage, stacktrace = [], handledState = defaultHandledState(), originalError) {
    // duck-typing ftw >_<
    this.__isBugsnagReport = true

    this._ignored = false
    this._handledState = handledState
    this._session = undefined

    this._logger = { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} }

    this._internalState = new State({
      apiKey: { initialValue: () => undefined },
      severity: { initialValue: () => this._handledState.severity },
      groupingHash: { initialValue: () => undefined },
      errorClass: { initialValue: () => stringOrFallback(errorClass, '[no error class]') },
      errorMessage: { initialValue: () => stringOrFallback(errorMessage, '[no error message]') },
      breadcrumbs: { initialValue: () => [] },
      stacktrace: {
        initialValue: () => reduce(stacktrace, (accum, frame) => {
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
    })

    this.originalError = originalError

    try { supportDeprecatedProps(this, 'report', DEPRECATED_PROPS) } catch (e) {}

    // Flags.
    // Note these are not initialised unless they are used
    // to save unnecessary bytes in the browser bundle

    /* this.attemptImmediateDelivery, default: true */
  }

  _supportDeprecatedProps () {
    map(DEPRECATED_PROPS, prop => Object.defineProperty(this, prop, {
      set: function (value) {
        this._logger.error(`Setting report.${prop} directly is no longer supported. Use report.set('${prop}', value) instead.`)
        this.set(prop, value)
      },
      get: function () {
        this._logger.error(`Getting report.${prop} directly is no longer supported. Use report.get('${prop}') instead.`)
        return this.get(prop)
      }
    }))
  }

  ignore () {
    this._ignored = true
  }

  isIgnored () {
    return this._ignored
  }

  get (...args) {
    return this._internalState.get(...args)
  }

  set (...args) {
    return this._internalState.set(...args)
  }

  clear (...args) {
    return this._internalState.clear(...args)
  }

  toJSON () {
    const payload = this._internalState.toPayload()
    return {
      payloadVersion: '4',
      exceptions: [
        {
          errorClass: payload.errorClass,
          message: payload.errorMessage,
          stacktrace: payload.stacktrace,
          type: jsRuntime
        }
      ],
      severity: payload.severity,
      unhandled: this._handledState.unhandled,
      severityReason: this._handledState.severityReason,
      app: payload.app,
      device: payload.device,
      breadcrumbs: payload.breadcrumbs,
      context: payload.context,
      user: payload.user,
      metaData: payload.metaData,
      groupingHash: payload.groupingHash,
      request: payload.request,
      session: this._session
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

BugsnagReport.getStacktrace = function (error, errorFramesToSkip = 0, generatedFramesToSkip = 0) {
  if (hasStack(error)) return ErrorStackParser.parse(error).slice(errorFramesToSkip)
  // in IE11 a new Error() doesn't have a stacktrace until you throw it, so try that here
  try {
    throw error
  } catch (e) {
    if (hasStack(e)) return ErrorStackParser.parse(error).slice(1 + generatedFramesToSkip)
    // error wasn't provided or didn't have a stacktrace so try to walk the callstack
    return filter(StackGenerator.backtrace(), frame =>
      (frame.functionName || '').indexOf('StackGenerator$$') === -1
    ).slice(1 + generatedFramesToSkip)
  }
}

BugsnagReport.ensureReport = function (reportOrError, errorFramesToSkip = 0, generatedFramesToSkip = 0) {
  // notify() can be called with a Report object. In this case no action is required
  if (reportOrError.__isBugsnagReport) return reportOrError
  try {
    const stacktrace = BugsnagReport.getStacktrace(reportOrError, errorFramesToSkip, 1 + generatedFramesToSkip)
    return new BugsnagReport(reportOrError.name, reportOrError.message, stacktrace, undefined, reportOrError)
  } catch (e) {
    return new BugsnagReport(reportOrError.name, reportOrError.message, [], undefined, reportOrError)
  }
}

module.exports = BugsnagReport
