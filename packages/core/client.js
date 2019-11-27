const config = require('./config')
const BugsnagEvent = require('./event')
const BugsnagBreadcrumb = require('./breadcrumb')
const BugsnagSession = require('./session')
const { map, includes } = require('./lib/es-utils')
const inferReleaseStage = require('./lib/infer-release-stage')
const isError = require('./lib/iserror')
const runCallbacks = require('./lib/callback-runner')

const LOG_USAGE_ERR_PREFIX = 'Usage error.'
const REPORT_USAGE_ERR_PREFIX = 'Bugsnag usage error.'

class BugsnagClient {
  constructor (notifier) {
    if (!notifier || !notifier.name || !notifier.version || !notifier.url) {
      throw new Error('`notifier` argument is required')
    }

    // notifier id
    this.notifier = notifier

    // configure() should be called before notify()
    this._configured = false

    // intialise opts and config
    this._opts = {}
    this.config = {}

    // // i/o
    this._delivery = { sendSession: () => {}, sendEvent: () => {} }
    this._logger = { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} }

    // plugins
    this._plugins = {}

    this._session = null

    this.breadcrumbs = []

    // setable props
    this.app = {}
    this.context = undefined
    this.device = undefined
    this.metaData = undefined
    this.request = undefined
    this.user = {}

    // expose internal constructors
    this.BugsnagClient = BugsnagClient
    this.BugsnagEvent = BugsnagEvent
    this.BugsnagBreadcrumb = BugsnagBreadcrumb
    this.BugsnagSession = BugsnagSession

    const self = this
    const notify = this.notify
    this.notify = function () {
      return notify.apply(self, arguments)
    }
  }

  setOptions (opts) {
    this._opts = { ...this._opts, ...opts }
  }

  configure (partialSchema = config.schema) {
    const conf = config.mergeDefaults(this._opts, partialSchema)
    const validity = config.validate(conf, partialSchema)

    if (!validity.valid === true) throw new Error(generateConfigErrorMessage(validity.errors))

    // update and elevate some special options if they were passed in at this point
    if (typeof conf.onError === 'function') conf.onError = [conf.onError]
    if (conf.appVersion) this.app.version = conf.appVersion
    if (conf.appType) this.app.type = conf.appType
    if (conf.metaData) this.metaData = conf.metaData
    if (conf.user) this.user = conf.user
    if (conf.logger) this.logger(conf.logger)

    // merge with existing config
    this.config = { ...this.config, ...conf }

    this._configured = true

    return this
  }

  use (plugin, ...args) {
    if (!this._configured) throw new Error('client not configured')
    if (plugin.configSchema) this.configure(plugin.configSchema)
    const result = plugin.init(this, ...args)
    // JS objects are not the safest way to store arbitrarily keyed values,
    // so bookend the key with some characters that prevent tampering with
    // stuff like __proto__ etc. (only store the result if the plugin had a
    // name)
    if (plugin.name) this._plugins[`~${plugin.name}~`] = result
    return this
  }

  getPlugin (name) {
    return this._plugins[`~${name}~`]
  }

  delivery (d) {
    this._delivery = d(this)
    return this
  }

  logger (l, sid) {
    this._logger = l
    return this
  }

  sessionDelegate (s) {
    this._sessionDelegate = s
    return this
  }

  startSession () {
    if (!this._sessionDelegate) {
      this._logger.warn('No session implementation is installed')
      return this
    }
    return this._sessionDelegate.startSession(this)
  }

  leaveBreadcrumb (message, metadata, type) {
    if (!this._configured) throw new Error('client not configured')

    // coerce bad values so that the defaults get set
    message = typeof message === 'string' ? message : ''
    type = typeof type === 'string' ? type : 'manual'
    metadata = typeof metadata === 'object' && metadata !== null ? metadata : {}

    // if no message, discard
    if (!message) return

    // check the breadcrumb is the list of enabled types
    if (!this.config.enabledBreadcrumbTypes || !includes(this.config.enabledBreadcrumbTypes, type)) return

    const crumb = new BugsnagBreadcrumb(message, metadata, type)

    // push the valid crumb onto the queue and maintain the length
    this.breadcrumbs.push(crumb)
    if (this.breadcrumbs.length > this.config.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(this.breadcrumbs.length - this.config.maxBreadcrumbs)
    }

    return this
  }

  notify (error, onError, cb = () => {}) {
    if (!this._configured) throw new Error('client not configured')

    // releaseStage can be set via config.releaseStage or client.app.releaseStage
    const releaseStage = inferReleaseStage(this)

    // ensure we have an error (or a reasonable object representation of an error)
    const { err, errorFramesToSkip } = normaliseError(error, this._logger)

    // create an event from the error, if it isn't one already
    const event = BugsnagEvent.ensureEvent(err, errorFramesToSkip, 2)

    event.app = { ...{ releaseStage }, ...event.app, ...this.app }
    event.context = event.context || this.context || undefined
    event.device = { ...event.device, ...this.device }
    event.request = { ...event.request, ...this.request }
    event.user = { ...event.user, ...this.user }
    event.metaData = { ...event.metaData, ...this.metaData }
    event.breadcrumbs = this.breadcrumbs.slice(0)

    if (this._session) {
      this._session.trackError(event)
      event.session = this._session
    }

    // exit early if events should not be sent on the current releaseStage
    if (this.config.enabledReleaseStages.length > 0 && !includes(this.config.enabledReleaseStages, releaseStage)) {
      this._logger.warn('Event not sent due to releaseStage/enabledReleaseStages configuration')
      return cb(null, event)
    }

    const originalSeverity = event.severity

    const onError = [].concat(opts.onError).concat(this.config.onError)
    const onCallbackError = err => {
      // errors in callbacks are tolerated but we want to log them out
      this._logger.error('Error occurred in onError callback, continuing anyway…')
      this._logger.error(err)
    }

    runCallbacks(onError, event, onCallbackError, (err, shouldSend) => {
      if (err) onCallbackError(err)

      if (!shouldSend) {
        this._logger.debug('Event not sent due to onError callback')
        return cb(null, event)
      }

      // only leave a crumb for the error if actually got sent
      BugsnagClient.prototype.leaveBreadcrumb.call(this, event.errorClass, {
        errorClass: event.errorClass,
        errorMessage: event.errorMessage,
        severity: event.severity
      }, 'error')

      if (originalSeverity !== event.severity) {
        event._handledState.severityReason = { type: 'userCallbackSetSeverity' }
      }

      this._delivery.sendEvent({
        apiKey: event.apiKey || this.config.apiKey,
        notifier: this.notifier,
        events: [event]
      }, (err) => cb(err, event))
    })
  }
}

const normaliseError = (error, logger) => {
  const synthesizedErrorFramesToSkip = 3

  const createAndLogUsageError = reason => {
    const msg = generateNotifyUsageMessage(reason)
    logger.warn(`${LOG_USAGE_ERR_PREFIX} ${msg}`)
    return new Error(`${REPORT_USAGE_ERR_PREFIX} ${msg}`)
  }

  let err
  let errorFramesToSkip = 0
  switch (typeof error) {
    case 'string':
      err = new Error(String(error))
      errorFramesToSkip = synthesizedErrorFramesToSkip
      break
    case 'number':
    case 'boolean':
      err = new Error(String(error))
      break
    case 'function':
      err = createAndLogUsageError('function')
      break
    case 'object':
      if (error !== null && (isError(error) || error.__isBugsnagEvent)) {
        err = error
      } else if (error !== null && hasNecessaryFields(error)) {
        err = new Error(error.message || error.errorMessage)
        err.name = error.name || error.errorClass
        errorFramesToSkip = synthesizedErrorFramesToSkip
      } else {
        err = createAndLogUsageError(error === null ? 'null' : 'unsupported object')
      }
      break
    default:
      err = createAndLogUsageError('nothing')
  }
  return { err, errorFramesToSkip }
}

const hasNecessaryFields = error =>
  (typeof error.name === 'string' || typeof error.errorClass === 'string') &&
  (typeof error.message === 'string' || typeof error.errorMessage === 'string')

const generateConfigErrorMessage = errors =>
  `Bugsnag configuration error\n${map(errors, (err) => `"${err.key}" ${err.message} \n    got ${stringify(err.value)}`).join('\n\n')}`

const generateNotifyUsageMessage = actual =>
  `notify(err) expected an error, got ${actual}`

const stringify = val => typeof val === 'object' ? JSON.stringify(val) : String(val)

module.exports = BugsnagClient
