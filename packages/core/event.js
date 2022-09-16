const ErrorStackParser = require('./lib/error-stack-parser')
const StackGenerator = require('stack-generator')
const hasStack = require('./lib/has-stack')
const map = require('./lib/es-utils/map')
const reduce = require('./lib/es-utils/reduce')
const filter = require('./lib/es-utils/filter')
const assign = require('./lib/es-utils/assign')
const metadataDelegate = require('./lib/metadata-delegate')
const featureFlagDelegate = require('./lib/feature-flag-delegate')
const isError = require('./lib/iserror')

class Event {
  constructor (errorClass, errorMessage, stacktrace = [], handledState = defaultHandledState(), originalError) {
    this.apiKey = undefined
    this.context = undefined
    this.groupingHash = undefined
    this.originalError = originalError

    this._handledState = handledState
    this.severity = this._handledState.severity
    this.unhandled = this._handledState.unhandled

    this.app = {}
    this.device = {}
    this.request = {}

    this.breadcrumbs = []
    this.threads = []

    this._metadata = {}
    this._features = []
    this._featuresIndex = {}
    this._user = {}
    this._session = undefined

    this.errors = [
      createBugsnagError(errorClass, errorMessage, Event.__type, stacktrace)
    ]

    // Flags.
    // Note these are not initialised unless they are used
    // to save unnecessary bytes in the browser bundle

    /* this.attemptImmediateDelivery, default: true */
  }

  addMetadata (section, keyOrObj, maybeVal) {
    return metadataDelegate.add(this._metadata, section, keyOrObj, maybeVal)
  }

  getMetadata (section, key) {
    return metadataDelegate.get(this._metadata, section, key)
  }

  clearMetadata (section, key) {
    return metadataDelegate.clear(this._metadata, section, key)
  }

  addFeatureFlag (name, variant = null) {
    featureFlagDelegate.add(this._features, this._featuresIndex, name, variant)
  }

  addFeatureFlags (featureFlags) {
    featureFlagDelegate.merge(this._features, featureFlags, this._featuresIndex)
  }

  getFeatureFlags () {
    return featureFlagDelegate.toEventApi(this._features)
  }

  clearFeatureFlag (name) {
    featureFlagDelegate.clear(this._features, this._featuresIndex, name)
  }

  clearFeatureFlags () {
    this._features = []
    this._featuresIndex = {}
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
      exceptions: map(this.errors, er => assign({}, er, { message: er.errorMessage })),
      severity: this.severity,
      unhandled: this._handledState.unhandled,
      severityReason: this._handledState.severityReason,
      app: this.app,
      device: this.device,
      request: this.request,
      breadcrumbs: this.breadcrumbs,
      context: this.context,
      groupingHash: this.groupingHash,
      metaData: this._metadata,
      user: this._user,
      session: this._session,
      featureFlags: this.getFeatureFlags()
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

const ensureString = (str) => typeof str === 'string' ? str : ''

function createBugsnagError (errorClass, errorMessage, type, stacktrace) {
  return {
    errorClass: ensureString(errorClass),
    errorMessage: ensureString(errorMessage),
    type,
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
}

function getCauseStack (error) {
  if (error.cause) {
    return [error, ...getCauseStack(error.cause)]
  } else {
    return [error]
  }
}

// Helpers

Event.getStacktrace = function (error, errorFramesToSkip, backtraceFramesToSkip) {
  if (hasStack(error)) return ErrorStackParser.parse(error).slice(errorFramesToSkip)
  // error wasn't provided or didn't have a stacktrace so try to walk the callstack
  try {
    return filter(StackGenerator.backtrace(), frame =>
      (frame.functionName || '').indexOf('StackGenerator$$') === -1
    ).slice(1 + backtraceFramesToSkip)
  } catch (e) {
    return []
  }
}

Event.create = function (maybeError, tolerateNonErrors, handledState, component, errorFramesToSkip = 0, logger) {
  const [error, internalFrames] = normaliseError(maybeError, tolerateNonErrors, component, logger)
  let event
  try {
    const stacktrace = Event.getStacktrace(
      error,
      // if an error was created/throw in the normaliseError() function, we need to
      // tell the getStacktrace() function to skip the number of frames we know will
      // be from our own functions. This is added to the number of frames deep we
      // were told about
      internalFrames > 0 ? 1 + internalFrames + errorFramesToSkip : 0,
      // if there's no stacktrace, the callstack may be walked to generated one.
      // this is how many frames should be removed because they come from our library
      1 + errorFramesToSkip
    )
    event = new Event(error.name, error.message, stacktrace, handledState, maybeError)
  } catch (e) {
    event = new Event(error.name, error.message, [], handledState, maybeError)
  }
  if (error.name === 'InvalidError') {
    event.addMetadata(`${component}`, 'non-error parameter', makeSerialisable(maybeError))
  }
  if (error.cause) {
    const causes = getCauseStack(error).slice(1)
    const normalisedCauses = map(causes, (cause) => {
      // Only get stacktrace for error causes that are a valid JS Error and already have a stack
      const stacktrace = (isError(cause) && hasStack(cause)) ? ErrorStackParser.parse(cause) : []
      const [error] = normaliseError(cause, true, 'error cause')
      if (error.name === 'InvalidError') event.addMetadata('error cause', makeSerialisable(cause))
      return createBugsnagError(error.name, error.message, Event.__type, stacktrace)
    })

    event.errors.push(...normalisedCauses)
  }

  return event
}

const makeSerialisable = (err) => {
  if (err === null) return 'null'
  if (err === undefined) return 'undefined'
  return err
}

const normaliseError = (maybeError, tolerateNonErrors, component, logger) => {
  let error
  let internalFrames = 0

  const createAndLogInputError = (reason) => {
    const verb = (component === 'error cause' ? 'was' : 'received')
    if (logger) logger.warn(`${component} ${verb} a non-error: "${reason}"`)
    const err = new Error(`${component} ${verb} a non-error. See "${component}" tab for more detail.`)
    err.name = 'InvalidError'
    return err
  }

  // In some cases:
  //
  //  - the promise rejection handler (both in the browser and node)
  //  - the node uncaughtException handler
  //
  // We are really limited in what we can do to get a stacktrace. So we use the
  // tolerateNonErrors option to ensure that the resulting error communicates as
  // such.
  if (!tolerateNonErrors) {
    if (isError(maybeError)) {
      error = maybeError
    } else {
      error = createAndLogInputError(typeof maybeError)
      internalFrames += 2
    }
  } else {
    switch (typeof maybeError) {
      case 'string':
      case 'number':
      case 'boolean':
        error = new Error(String(maybeError))
        internalFrames += 1
        break
      case 'function':
        error = createAndLogInputError('function')
        internalFrames += 2
        break
      case 'object':
        if (maybeError !== null && isError(maybeError)) {
          error = maybeError
        } else if (maybeError !== null && hasNecessaryFields(maybeError)) {
          error = new Error(maybeError.message || maybeError.errorMessage)
          error.name = maybeError.name || maybeError.errorClass
          internalFrames += 1
        } else {
          error = createAndLogInputError(maybeError === null ? 'null' : 'unsupported object')
          internalFrames += 2
        }
        break
      default:
        error = createAndLogInputError('nothing')
        internalFrames += 2
    }
  }

  if (!hasStack(error)) {
    // in IE10/11 a new Error() doesn't have a stacktrace until you throw it, so try that here
    try {
      throw error
    } catch (e) {
      if (hasStack(e)) {
        error = e
        // if the error only got a stacktrace after we threw it here, we know it
        // will only have one extra internal frame from this function, regardless
        // of whether it went through createAndLogInputError() or not
        internalFrames = 1
      }
    }
  }

  return [error, internalFrames]
}

// default value for stacktrace.type
Event.__type = 'browserjs'

const hasNecessaryFields = error =>
  (typeof error.name === 'string' || typeof error.errorClass === 'string') &&
  (typeof error.message === 'string' || typeof error.errorMessage === 'string')

module.exports = Event
