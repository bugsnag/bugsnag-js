const config = require('./config')
const BugsnagReport = require('./report')
const BugsnagBreadcrumb = require('./breadcrumb')
const BugsnagSession = require('./session')
const { map, includes, isArray } = require('./lib/es-utils')
const isError = require('./lib/iserror')
const some = require('./lib/async-some')
const runBeforeSend = require('./lib/run-before-send')
const State = require('./lib/state')

const LOG_USAGE_ERR_PREFIX = `Usage error.`
const REPORT_USAGE_ERR_PREFIX = `Bugsnag usage error.`

const DEPRECATED_PROPS = [ 'app', 'device', 'context', 'user', 'request', 'metaData' ]

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
    this._delivery = { sendSession: () => {}, sendReport: () => {} }
    this._logger = { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} }

    // plugins
    this._plugins = {}

    this._session = null

    this.breadcrumbs = []

    this._internalState = new State({}, (msg) => this._logger.warn(msg))

    // expose internal constructors
    this.BugsnagClient = BugsnagClient
    this.BugsnagReport = BugsnagReport
    this.BugsnagBreadcrumb = BugsnagBreadcrumb
    this.BugsnagSession = BugsnagSession

    var self = this
    var notify = this.notify
    this.notify = function () {
      return notify.apply(self, arguments)
    }

    try { this._supportDeprecatedProps() } catch (e) {}
  }

  _supportDeprecatedProps () {
    map(DEPRECATED_PROPS, prop => Object.defineProperty(this, prop, {
      set: function (value) {
        this._logger.error(`Setting client.${prop} directly is no longer supported. Use client.set('${prop}', value) instead.`)
        this.set(prop, value)
      },
      get: function () {
        this._logger.error(`Getting client.${prop} directly is no longer supported. Use client.get('${prop}') instead.`)
        return this.get(prop)
      }
    }))
  }

  setOptions (opts) {
    this._opts = { ...this._opts, ...opts }
  }

  get (...args) {
    return this._internalState.get(...args)
  }

  set (...args) {
    return this._internalState.set(...args)
  }

  configure (partialSchema = config.schema) {
    const conf = config.mergeDefaults(this._opts, partialSchema)
    const validity = config.validate(conf, partialSchema)

    if (!validity.valid === true) throw new Error(generateConfigErrorMessage(validity.errors))

    // ensure beforeSend is an array
    if (typeof conf.beforeSend === 'function') conf.beforeSend = [ conf.beforeSend ]

    if (conf.appVersion) this.set('app', 'version', conf.appVersion)
    if (conf.releaseStage) this.set('app', 'releaseStage', conf.releaseStage)
    if (conf.appType) this.set('app', 'type', conf.appType)
    if (conf.metaData) this.set(conf.metaData)
    if (conf.user) this.set('user', conf.user)

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

  leaveBreadcrumb (name, metaData, type, timestamp) {
    if (!this._configured) throw new Error('client not configured')

    // coerce bad values so that the defaults get set
    name = name || undefined
    type = typeof type === 'string' ? type : undefined
    timestamp = typeof timestamp === 'string' ? timestamp : undefined
    metaData = typeof metaData === 'object' && metaData !== null ? metaData : undefined

    // if no name and no metaData, usefulness of this crumb is questionable at best so discard
    if (typeof name !== 'string' && !metaData) return

    const crumb = new BugsnagBreadcrumb(name, metaData, type, timestamp)

    // push the valid crumb onto the queue and maintain the length
    this.breadcrumbs.push(crumb)
    if (this.breadcrumbs.length > this.config.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(this.breadcrumbs.length - this.config.maxBreadcrumbs)
    }

    return this
  }

  notify (error, beforeSend = () => {}, cb = () => {}) {
    if (!this._configured) throw new Error('client not configured')

    // ensure we have an error (or a reasonable object representation of an error)
    let { err, errorFramesToSkip } = normaliseError(error, this._logger)

    // create a report from the error, if it isn't one already
    const report = BugsnagReport.ensureReport(err, errorFramesToSkip, 2)

    // give all of the client's internal state to the report
    report._internalState.extend(this._internalState)
    // allow the report to use the client's logger
    report._logger = this._logger
    // copy in breadcrumbs
    report.set('breadcrumbs', this.breadcrumbs.slice(0))
    // prevent any subsequent changes to immutable properties
    report._internalState.lock()

    if (this._session) {
      this._session.trackError(report)
      report._session = this._session
    }

    // exit early if the reports should not be sent on the current releaseStage
    if (isArray(this.config.notifyReleaseStages) && !includes(this.config.notifyReleaseStages, this.config.releaseStage)) {
      this._logger.warn(`Report not sent due to releaseStage/notifyReleaseStages configuration`)
      return cb(null, report)
    }

    const originalSeverity = report.get('severity')

    const callbacks = this.config.beforeSend.concat(beforeSend)
    const onBeforeSendErr = err => {
      this._logger.error(`Error occurred in beforeSend callback, continuing anyway…`)
      this._logger.error(err)
    }

    some(callbacks, runBeforeSend(report, onBeforeSendErr), (err, preventSend) => {
      if (err) onBeforeSendErr(err)

      if (preventSend) {
        this._logger.debug(`Report not sent due to beforeSend callback`)
        return cb(null, report)
      }

      // only leave a crumb for the error if actually got sent
      if (this.config.autoBreadcrumbs) {
        this.leaveBreadcrumb(report.get('errorClass'), {
          errorClass: report.get('errorClass'),
          errorMessage: report.get('errorMessage'),
          severity: report.get('severity')
        }, 'error')
      }

      if (originalSeverity !== report.get('severity')) {
        report._handledState.severityReason = { type: 'userCallbackSetSeverity' }
      }

      this._delivery.sendReport({
        apiKey: report.get('apiKey') || this.config.apiKey,
        notifier: this.notifier,
        events: [ report ]
      }, (err) => cb(err, report))
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
      if (error !== null && (isError(error) || error.__isBugsnagReport)) {
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
  `notify() expected error/opts parameters, got ${actual}`

const stringify = val => typeof val === 'object' ? JSON.stringify(val) : String(val)

module.exports = BugsnagClient
