const config = require('./config')
const BugsnagReport = require('./report')
const BugsnagBreadcrumb = require('./breadcrumb')
const { map, reduce, includes, isArray } = require('./lib/es-utils')
const jsonStringify = require('fast-safe-stringify')
// const uid = require('cuid')

const noop = () => {}

class BugsnagClient {
  constructor (notifier, configSchema = config.schema, session = null) {
    if (!notifier) throw new Error('new BugsnagClient(notifier, configSchema) requires `notifier` argument')
    if (!notifier.name || !notifier.version || !notifier.url) {
      throw new Error('new BugsnagClient(notifier, configSchema) - `notifier` requires: `{ name, version, url }`')
    }

    // notifier id
    this.notifier = notifier

    // config
    this.configSchema = configSchema

    // configure() should be called before notify()
    this._configured = false

    // i/o
    this._transport = { name: 'NULL_TRANSPORT', sendSession: noop, sendReport: noop }
    this._logger = { debug: noop, info: noop, warn: noop, error: noop }

    // plugins
    this.plugins = []

    this.session = session
    this.breadcrumbs = []

    // setable props
    this.app = {}
    this.context = undefined
    this.device = undefined
    this.metaData = undefined
    this.request = undefined
    this.user = {}
  }

  configure (opts = {}) {
    this._logger.debug(`configuring`)
    this.config = config.mergeDefaults({ ...this.config, ...opts }, this.configSchema)
    const validity = config.validate(this.config, this.configSchema)
    if (!validity.valid === true) {
      const err = new Error('Bugsnag configuration error')
      err.errors = map(validity.errors, (err) => `${err.key} ${err.message} \n  ${err.value}`)
      throw err
    }
    if (typeof this.config.beforeSend === 'function') this.config.beforeSend = [ this.config.beforeSend ]
    this._configured = true
    return this
  }

  use (plugin) {
    this.plugins.push(plugin)
    plugin.init(this, BugsnagReport)
    return this
  }

  transport (t) {
    this._transport = t
    return this
  }

  logger (l, sid) {
    this._logger = l
    return this
  }

  leaveBreadcrumb (name, metaData, type, timestamp) {
    if (!this._configured) throw new Error('Bugsnag must be configured before calling leaveBreadcrumb()')

    // coerce bad values so that the defaults get set
    name = name || undefined
    type = typeof type === 'string' ? type : undefined
    timestamp = typeof timestamp === 'string' ? timestamp : undefined
    metaData = typeof metaData === 'object' && metaData !== null ? metaData : undefined

    // if no name and no metaData, usefulness of this crumb is questionable at best so discard
    if (typeof name !== 'string' && !metaData) return

    const crumb = new BugsnagBreadcrumb(name, metaData, type, timestamp)
    const c = jsonStringify(crumb)
    const isDupe = reduce(this.breadcrumbs, (accum, crumb) => {
      if (accum) return accum
      return c === jsonStringify(crumb)
    }, false)

    // no duplicates
    if (isDupe) return

    // push the valid crumb onto the queue and maintain the length
    this.breadcrumbs.push(crumb)
    if (this.breadcrumbs.length > this.config.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(this.breadcrumbs.length - this.config.maxBreadcrumbs)
    }

    return this
  }

  notify (error, opts = {}) {
    if (!this._configured) throw new Error('Bugsnag must be configured before calling report()')

    // releaseStage can be set via config.releaseStage or client.app.releaseStage
    const releaseStage = this.app && typeof this.app.releaseStage === 'string' ? this.app.releaseStage : this.config.releaseStage

    // ensure we have an error (or a reasonable object representation of an error)
    let err
    switch (typeof error) {
      case 'string':
        if (typeof opts === 'string') {
          // ≤v3 used to have a notify('ErrorName', 'Error message') interface
          // report usage/deprecation errors if this function is called like that
          err = new Error('Bugsnag usage error. notify() called with (string, string) but expected (error, object)')
          opts = { metaData: { notifier: { notifyArgs: [ error, opts ] } } }
        } else {
          err = new Error(String(error))
        }
        break
      case 'number':
      case 'boolean':
        err = new Error(String(error))
        break
      case 'function':
        err = new Error('Bugsnag usage error. notify() called with a function as "error" parameter')
        break
      case 'object':
        err = error
    }

    // if we have something falsey at this point, report usage error
    if (!err) err = new Error('Bugsnag usage error. notify() called with no "error" parameter')

    // ensure opts is an object
    if (typeof opts !== 'object' || opts === null) opts = {}

    // create a report from the error, if it isn't one already
    const report = BugsnagReport.ensureReport(err, 1)

    report.app = { ...{ releaseStage }, ...report.app, ...this.app }
    report.context = report.context || opts.context || this.context || undefined
    report.device = { ...report.device, ...this.device, ...opts.device }
    report.request = { ...report.request, ...this.request, ...opts.request }
    report.user = { ...report.user, ...this.user, ...opts.user }
    report.metaData = { ...report.metaData, ...this.metaData, ...opts.metaData }
    report.breadcrumbs = this.breadcrumbs.slice(0)

    // set severity if supplied
    if (opts.severity !== undefined) {
      report.severity = opts.severity
      report._handledState.severityReason = { type: 'userSpecifiedSeverity' }
    }

    // exit early if the reports should not be sent on the current releaseStage
    if (isArray(this.config.notifyReleaseStages) && !includes(this.config.notifyReleaseStages, releaseStage)) return false

    const originalSeverity = report.severity

    const beforeSend = [].concat(opts.beforeSend).concat(this.config.beforeSend)
    const preventSend = reduce(beforeSend, (accum, fn) => {
      if (accum === true) return true
      if (typeof fn === 'function' && fn(report) === false) return true
      if (report.isIgnored()) return true
      return false
    }, false)

    if (preventSend) return false

    // only leave a crumb for the error if actually got sent
    this.leaveBreadcrumb(report.errorClass, {
      errorClass: report.errorClass,
      errorMessage: report.errorMessage,
      severity: report.severity,
      stacktrace: report.stacktrace
    }, 'error')

    if (originalSeverity !== report.severity) {
      report._handledState.severityReason = { type: 'userCallbackSetSeverity' }
    }

    this._transport.sendReport(this._logger, this.config, {
      apiKey: report.apiKey || this.config.apiKey,
      notifier: this.notifier,
      events: [ report ]
    })

    return true
  }
}

module.exports = BugsnagClient
