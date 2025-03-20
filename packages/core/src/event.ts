import { App, Device, FeatureFlag, Logger, Request, Stackframe, Thread, User, BugsnagError, NotifiableError } from "./common"

import ErrorStackParser from './lib/error-stack-parser'
// @ts-expect-error no types
import StackGenerator from 'stack-generator'
import hasStack from './lib/has-stack'
import reduce from './lib/es-utils/reduce'
import filter from './lib/es-utils/filter'
import assign from './lib/es-utils/assign'
import metadataDelegate from './lib/metadata-delegate'
import featureFlagDelegate from './lib/feature-flag-delegate'
import isError from './lib/iserror'
import Breadcrumb from "./breadcrumb"
import Session from "./session"

interface HandledState {
  unhandled: boolean
  severity: string
  severityReason: { type: string; unhandledOverridden?: boolean }
}

export default class Event {
  public apiKey: string | undefined
  public context: string | undefined
  public groupingHash: string | undefined
  public severity: string
  public unhandled: boolean

  public app: App
  public device: Device
  public request: Request

  public errors: BugsnagError[];
  public breadcrumbs: Breadcrumb[]
  public threads: Thread[]

  public _metadata: { [key: string]: any }
  public _features: FeatureFlag | null[]
  public _featuresIndex: { [key: string]: number }

  public _user: User
  private _correlation?: { spanId?: string, traceId: string }
  public _session?: Session

  // default value for stacktrace.type
  public static __type: string = 'browserjs'

  constructor (
    public readonly errorClass: string,
    public readonly errorMessage: string,
    public readonly stacktrace: any[] = [],
    public readonly _handledState: HandledState = defaultHandledState(),
    public readonly originalError?: NotifiableError
  ) {
    this.apiKey = undefined
    this.context = undefined
    this.groupingHash = undefined
    this.originalError = originalError

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
    this._correlation = undefined

    this.errors = [
      createBugsnagError(errorClass, errorMessage, Event.__type, stacktrace)
    ]

    // Flags.
    // Note these are not initialised unless they are used
    // to save unnecessary bytes in the browser bundle

    /* this.attemptImmediateDelivery, default: true */
  }

  addMetadata (section: string, keyOrObj?: any, maybeVal?: any) {
    return metadataDelegate.add(this._metadata, section, keyOrObj, maybeVal)
  }

  /**
     * Associate this event with a specific trace. This is usually done automatically when
     * using bugsnag-js-performance, but can also be set manually if required.
     *
     * @param traceId the ID of the trace the event occurred within
     * @param spanId the ID of the span that the event occurred within
     */
  setTraceCorrelation (traceId?: string, spanId?: string) {
    if (typeof traceId === 'string') {
      this._correlation = { traceId, ...typeof spanId === 'string' ? { spanId } : { } }
    }
  }

  getMetadata (section: string, key?: string) {
    return metadataDelegate.get(this._metadata, section, key)
  }

  clearMetadata (section: string, key?: string) {
    return metadataDelegate.clear(this._metadata, section, key)
  }

  addFeatureFlag (name: string, variant: string | null = null) {
    featureFlagDelegate.add(this._features, this._featuresIndex, name, variant)
  }

  addFeatureFlags (featureFlags: FeatureFlag[]) {
    featureFlagDelegate.merge(this._features, featureFlags, this._featuresIndex)
  }

  getFeatureFlags () {
    return featureFlagDelegate.toEventApi(this._features)
  }

  clearFeatureFlag (name: string) {
    featureFlagDelegate.clear(this._features, this._featuresIndex, name)
  }

  clearFeatureFlags () {
    this._features = []
    this._featuresIndex = {}
  }

  getUser () {
    return this._user
  }

  setUser (id?: string | null, email?: string | null, name?: string | null) {
    this._user = { id, email, name }
  }

  toJSON () {
    return {
      payloadVersion: '4',
      exceptions: this.errors.map(er => assign({}, er, { message: er.errorMessage })),
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
      featureFlags: this.getFeatureFlags(),
      correlation: this._correlation
    }
  }

  // Helpers
static getStacktrace = function (error: Error, errorFramesToSkip: number, backtraceFramesToSkip: number) {
  if (hasStack(error)) return ErrorStackParser.parse(error).slice(errorFramesToSkip)
  // error wasn't provided or didn't have a stacktrace so try to walk the callstack
  try {
    return filter(StackGenerator.backtrace(), (frame: StackTraceJsStyleStackframe) =>
      (frame.functionName || '').indexOf('StackGenerator$$') === -1
    ).slice(1 + backtraceFramesToSkip)
  } catch (e) {
    return []
  }
}

static create = function (maybeError: NotifiableError, tolerateNonErrors: boolean, handledState: HandledState | undefined, component: string, errorFramesToSkip = 0, logger?: Logger) {
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
    const normalisedCauses = causes.map((cause) => {
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
}

interface StackTraceJsStyleStackframe {
  functionName: string,
  args: string[],
  fileName: string,
  lineNumber: number,
  columnNumber: number, 
  isEval: boolean,
  isNative: boolean,
  source: string,
}

// takes a stacktrace.js style stackframe (https://github.com/stacktracejs/stackframe)
// and returns a Bugsnag compatible stackframe (https://docs.bugsnag.com/api/error-reporting/#json-payload)
const formatStackframe = (frame: StackTraceJsStyleStackframe): Stackframe => {
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

const normaliseFunctionName = (name: string) => /^global code$/i.test(name) ? 'global code' : name

const defaultHandledState = () => ({
  unhandled: false,
  severity: 'warning',
  severityReason: { type: 'handledException' }
})

const ensureString = (str: unknown): string => typeof str === 'string' ? str : ''

function createBugsnagError (errorClass: unknown, errorMessage: unknown, type: string, stacktrace: any[]): BugsnagError {
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

function getCauseStack (error: Error): Error[] {
  if (error.cause) {
    return [error, ...getCauseStack(error.cause as Error)]
  } else {
    return [error]
  }
}

const makeSerialisable = (err?: any) => {
  if (err === null) return 'null'
  if (err === undefined) return 'undefined'
  return err
}

const normaliseError = (maybeError: unknown, tolerateNonErrors: boolean, component: string, logger?: Logger): [Error, number] => {
  let error
  let internalFrames = 0

  const createAndLogInputError = (reason: string) => {
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
          error.name = maybeError.name || maybeError.errorClass || ''
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

  return [error as Error, internalFrames]
}

const hasNecessaryFields = (error: unknown): error is { name?: string; errorClass?: string; message?: string; errorMessage?: string } =>
  // @ts-expect-error - needs rewriting to be more type safe
  (typeof error.name === 'string' || typeof error.errorClass === 'string') &&
  // @ts-expect-error - needs rewriting to be more type safe
  (typeof error.message === 'string' || typeof error.errorMessage === 'string')

