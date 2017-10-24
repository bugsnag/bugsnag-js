const config = require('./config')
const BugsnagReport = require('./report')
const BugsnagBreadcrumb = require('./breadcrumb')
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
    this.user = {}
  }

  configure (opts = {}) {
    this._logger.debug(`configuring`)
    this.config = config.mergeDefaults(Object.assign({}, this.config, opts), this.configSchema)
    const validity = config.validate(this.config, this.configSchema)
    if (!validity.valid === true) {
      const err = new Error('Bugsnag configuration error')
      err.errors = validity.errors.map(err => `${err.key} ${err.message} \n  ${err.value}`)
      throw err
    }
    if (typeof this.config.beforeSend === 'function') this.config.beforeSend = [ this.config.beforeSend ]
    this._configured = true
    return this
  }

  use (plugin) {
    this._logger.debug(`running plugin: "${plugin.name}" (${plugin.description})`)
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

  leaveBreadcrumb (...args) {
    if (!this._configured) throw new Error('Bugsnag must be configured before calling leaveBreadcrumb()')
    this.breadcrumbs.push(BugsnagBreadcrumb.ensureBreadcrumb(...args))
    if (this.breadcrumbs.length > this.config.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(this.breadcrumbs.length - this.config.maxBreadcrumbs)
    }
  }

  // startSession (s) {
  //   const session = Object.assign({}, s, {
  //     id: uid(), startedAt: (new Date()).toISOString()
  //   })
  //
  //   const sessionClient = new BugsnagClient(this.notifier, this.configSchema, session)
  //
  //   sessionClient.configure(this.config)
  //
  //   // inherit all of the original clients props
  //   sessionClient.app = this.app
  //   sessionClient.context = this.context
  //   sessionClient.device = this.device
  //   sessionClient.metaData = this.metaData
  //   sessionClient.user = this.user
  //
  //   return sessionClient
  // }

  notify (error, opts = {}) {
    if (!this._configured) throw new Error('Bugsnag must be configured before calling report()')

    // releaseStage can be set via config.releaseStage or client.app.releaseStage
    const releaseStage = this.app && typeof this.app.releaseStage === 'string' ? this.app.releaseStage : this.config.releaseStage

    // exit early if the reports should not be sent on the current releaseStage
    if (!this.config.notifyReleaseStages.includes(releaseStage)) return false

    // ensure we have an error (or a reasonable object representation of an error)
    let err
    switch (typeof error) {
      case 'number':
      case 'string':
      case 'boolean':
        err = new Error(error.toString())
        break
      case 'function':
        err = new Error('Bugsnag usage error. notify() called with a function as "error" parameter')
        break
      case 'object':
        err = error
    }

    // if we have something falsey at this point, report usage error
    if (!error) err = new Error('Bugsnag usage error. notify() called with no "error" parameter')

    // create a report from the error, if it isn't one already
    const report = BugsnagReport.ensureReport(err, 1)

    report.app = Object.assign({ releaseStage }, report.app, this.app)
    report.context = report.context || opts.context || this.context || undefined
    report.device = Object.assign({}, report.advice, this.device, opts.device)
    report.user = Object.assign({}, report.user, this.user, opts.user)
    report.metaData = Object.assign({}, report.metaData, this.metaData, opts.metaData)
    report.breadcrumbs = this.breadcrumbs.slice(0)

    // set severity if supplied
    if (opts.severity !== undefined) {
      report.severity = opts.severity
      report._handledState.severityReason = { type: 'userSpecifiedSeverity' }
    }

    // // set session if in use
    // if (this.session) report.session = this.session

    const originalSeverity = report.severity

    const beforeSend = [].concat(opts.beforeSend).concat(this.config.beforeSend).filter(Boolean)
    const preventSend = beforeSend.some(fn => fn(report) === false || report.isIgnored())

    if (preventSend) return false

    if (originalSeverity !== report.severity) {
      report._handledState.severityReason = { type: 'userCallbackSetSeverity' }
    }

    this._transport.sendReport(this.config, {
      apiKey: report.apiKey || this.config.apiKey,
      notifier: this.notifier,
      events: [ report ]
    })

    return true
  }
}

module.exports = BugsnagClient
