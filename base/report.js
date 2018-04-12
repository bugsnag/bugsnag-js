const ErrorStackParser = require('error-stack-parser')
const StackGenerator = require('stack-generator')
const hasStack = require('./lib/has-stack')
const { reduce, filter } = require('./lib/es-utils')

class BugsnagReport {
  constructor (errorClass, errorMessage, stacktrace = [], handledState = defaultHandledState()) {
    // duck-typing ftw >_<
    this.__isBugsnagReport = true

    this._ignored = false

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
    this.metaData = {}
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
    this.user = undefined
    this.session = undefined
  }

  ignore () {
    this._ignored = true
  }

  isIgnored () {
    return this._ignored
  }

  updateMetaData (section, ...args) {
    if (!section) return this
    let updates

    // updateMetaData("section", null) -> removes section
    if (args[0] === null) return this.removeMetaData(section)

    // updateMetaData("section", "property", null) -> removes property from section
    if (args[1] === null) return this.removeMetaData(section, args[0], args[1])

    // normalise the two supported input types into object form
    if (typeof args[0] === 'object') updates = args[0]
    if (typeof args[0] === 'string') updates = { [args[0]]: args[1] }

    // exit if we don't have an updates object at this point
    if (!updates) return this

    // ensure a section with this name exists
    if (!this.metaData[section]) this.metaData[section] = {}

    // merge the updates with the existing section
    this.metaData[section] = { ...this.metaData[section], ...updates }

    return this
  }

  removeMetaData (section, property) {
    if (typeof section !== 'string') return this

    // remove an entire section
    if (!property) {
      delete this.metaData[section]
      return this
    }

    // remove a single property from a section
    if (this.metaData[section]) {
      delete this.metaData[section][property]
      return this
    }

    return this
  }

  toJSON () {
    return {
      payloadVersion: '4',
      exceptions: [
        {
          errorClass: this.errorClass,
          message: this.errorMessage,
          stacktrace: this.stacktrace,
          type: 'browserjs'
        }
      ],
      severity: this.severity,
      unhandled: this._handledState.unhandled,
      severityReason: this._handledState.severityReason,
      app: this.app,
      device: this.device,
      breadcrumbs: this.breadcrumbs,
      context: this.context,
      user: this.user,
      metaData: this.metaData,
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

BugsnagReport.getStacktrace = (error, errorFramesToSkip = 0, generatedFramesToSkip = 0) => {
  if (hasStack(error)) return ErrorStackParser.parse(error).slice(errorFramesToSkip)
  // error wasn't provided or didn't have a stacktrace so try to walk the callstack
  return filter(StackGenerator.backtrace(), frame =>
    (frame.functionName || '').indexOf('StackGenerator$$') === -1
  ).slice(1 + generatedFramesToSkip)
}

BugsnagReport.ensureReport = function (reportOrError, errorFramesToSkip = 0, generatedFramesToSkip = 0) {
  // notify() can be called with a Report object. In this case no action is required
  if (reportOrError.__isBugsnagReport) return reportOrError
  try {
    const stacktrace = BugsnagReport.getStacktrace(reportOrError, errorFramesToSkip, 1 + generatedFramesToSkip)
    return new BugsnagReport(reportOrError.name, reportOrError.message, stacktrace)
  } catch (e) {
    return new BugsnagReport(reportOrError.name, reportOrError.message, [])
  }
}

module.exports = BugsnagReport
