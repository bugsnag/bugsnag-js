const ErrorStackParser = require('error-stack-parser')
const StackGenerator = require('stack-generator')
const hasStack = require('./lib/has-stack')
const { filter, map } = require('./lib/es-utils')

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
    this.errorClass = typeof errorClass === 'string' && errorClass ? errorClass : '[no error class]'
    this.errorMessage = typeof errorMessage === 'string' && errorMessage ? errorMessage : '[no error message]'
    this.groupingHash = undefined
    this.metaData = {}
    this.request = undefined
    this.severity = this._handledState.severity
    this.stacktrace = map(stacktrace, frame => formatStackframe(frame))
    // @TODO
    // don't include a stackframe if none of its properties are defined
    // if (f && filter(values(f)).length) return accum.concat(f)
    this.user = undefined
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
      request: this.request
    }
  }
}

// force `fast-safe-stringify` to do its thing
// https://github.com/davidmarkclements/fast-safe-stringify#tojson-support
BugsnagReport.prototype.toJSON.forceDecirc = true

// takes a stacktrace.js style stackframe (https://github.com/stacktracejs/stackframe)
// and returns a Bugsnag compatible stackframe (https://docs.bugsnag.com/api/error-reporting/#json-payload)
const formatStackframe = frame => ({
  file: frame.fileName,
  method: normaliseFunctionName(frame.functionName),
  lineNumber: frame.lineNumber,
  columnNumber: frame.columnNumber,
  code: undefined, // TODO
  inProject: undefined // TODO
})

const normaliseFunctionName = name => /^global code$/i.test(name) ? 'global code' : name

// stacktrace wasn't provided so we need to attempt to generate one
const generateStack = (framesToSkip) => {
  return filter(StackGenerator.backtrace(), frame => (frame.functionName || '').indexOf('StackGenerator$$') === -1)
    .slice(1 + framesToSkip) // remove this function and n others from the stack frames
}

const defaultHandledState = () => ({
  unhandled: false,
  severity: 'warning',
  severityReason: { type: 'handledException' }
})

// Helpers

BugsnagReport.ensureReport = function (reportOrError, framesToSkip = 0) {
  // notify() can be called with a Report object. In this case no action is required
  if (reportOrError.__isBugsnagReport) return reportOrError
  try {
    const stacktrace = hasStack(reportOrError) ? ErrorStackParser.parse(reportOrError).slice(framesToSkip) : generateStack(1 + framesToSkip)
    return new BugsnagReport(reportOrError.name, reportOrError.message, stacktrace)
  } catch (e) {
    return new BugsnagReport(reportOrError.name, reportOrError.message, [])
  }
}

module.exports = BugsnagReport
