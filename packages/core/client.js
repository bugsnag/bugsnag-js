const config = require('./config')
const Event = require('./event')
const Breadcrumb = require('./breadcrumb')
const Session = require('./session')
const { map, includes, filter } = require('./lib/es-utils')
const runCallbacks = require('./lib/callback-runner')
const metadataDelegate = require('./lib/metadata-delegate')
const runSyncCallbacks = require('./lib/sync-callback-runner')

const noop = () => {}

class Client {
  constructor (configuration, schema = config.schema, notifier) {
    // notifier id
    this._notifier = notifier

    // intialise opts and config
    this._opts = configuration
    this._config = {}
    this._schema = schema

    // i/o
    this._delivery = { sendSession: noop, sendEvent: noop }
    this._logger = { debug: noop, info: noop, warn: noop, error: noop }

    // plugins
    this._plugins = {}

    // state
    this._breadcrumbs = []
    this._session = null
    this._metadata = {}
    this._context = undefined
    this._user = {}

    // callbacks:
    //  e: onError
    //  s: onSession
    //  sp: onSessionPayload
    //  b: onBreadcrumb
    // (note these names are minified by hand because object
    // properties are not safe to minify automatically)
    this._cbs = {
      e: [],
      s: [],
      sp: [],
      b: []
    }

    // expose internal constructors
    this.Client = Client
    this.Event = Event
    this.Breadcrumb = Breadcrumb
    this.Session = Session

    this._extractConfiguration()

    // when notify() is called we need to know how many frames are from our own source
    // this inital value is 1 not 0 because we wrap notify() to ensure it is always
    // bound to have the client as its `this` value – see below.
    this._depth = 1

    const self = this
    const notify = this.notify
    this.notify = function () {
      return notify.apply(self, arguments)
    }
  }

  addMetadata (section, ...args) {
    return metadataDelegate.add(this._metadata, section, ...args)
  }

  getMetadata (section, key) {
    return metadataDelegate.get(this._metadata, section, key)
  }

  clearMetadata (section, key) {
    return metadataDelegate.clear(this._metadata, section, key)
  }

  getContext () {
    return this._context
  }

  setContext (c) {
    this._context = c
  }

  _extractConfiguration (partialSchema = this._schema) {
    const conf = config.mergeDefaults(this._opts, partialSchema)
    const validity = config.validate(conf, partialSchema)

    if (!validity.valid === true) throw new Error(generateConfigErrorMessage(validity.errors))

    // update and elevate some special options if they were passed in at this point
    if (conf.metadata) this._metadata = conf.metadata
    if (conf.user) this._user = conf.user
    if (conf.context) this._context = conf.context
    if (conf.logger) this._logger = conf.logger

    // add callbacks
    if (conf.onError && conf.onError.length) this._cbs.e = this._cbs.e.concat(conf.onError)
    if (conf.onBreadcrumb && conf.onBreadcrumb.length) this._cbs.b = this._cbs.b.concat(conf.onBreadcrumb)
    if (conf.onSession && conf.onSession.length) this._cbs.s = this._cbs.s.concat(conf.onSession)

    // merge with existing config
    this._config = { ...this._config, ...conf }
  }

  getUser () {
    return this._user
  }

  setUser (id, email, name) {
    this._user = { id, email, name }
  }

  use (plugin, ...args) {
    if (plugin.configSchema) this._extractConfiguration(plugin.configSchema)
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

  _setDelivery (d) {
    this._delivery = d(this)
  }

  startSession () {
    const session = new Session()

    session.app = {
      releaseStage: this._config.releaseStage,
      version: this._config.appVersion,
      type: this._config.appType
    }

    // run onSession callbacks
    const ignore = runSyncCallbacks(this._cbs.s, session, 'onSession', this._logger)

    if (ignore) {
      this._logger.debug('Session not started due to onSession callback')
      return this
    }
    return this._sessionDelegate.startSession(this, session)
  }

  addOnError (fn, front = false) {
    this._cbs.e[front ? 'unshift' : 'push'](fn)
  }

  removeOnError (fn) {
    this._cbs.e = filter(this._cbs.e, f => f !== fn)
  }

  _addOnSessionPayload (fn) {
    this._cbs.sp.push(fn)
  }

  addOnSession (fn) {
    this._cbs.s.push(fn)
  }

  removeOnSession (fn) {
    this._cbs.s = filter(this._cbs.s, f => f !== fn)
  }

  addOnBreadcrumb (fn) {
    this._cbs.b.push(fn)
  }

  removeOnBreadcrumb (fn) {
    this._cbs.b = filter(this._cbs.b, f => f !== fn)
  }

  pauseSession () {
    return this._sessionDelegate.pauseSession(this)
  }

  resumeSession () {
    return this._sessionDelegate.resumeSession(this)
  }

  leaveBreadcrumb (message, metadata, type) {
    // coerce bad values so that the defaults get set
    message = typeof message === 'string' ? message : ''
    type = typeof type === 'string' ? type : 'manual'
    metadata = typeof metadata === 'object' && metadata !== null ? metadata : {}

    // if no message, discard
    if (!message) return

    // check the breadcrumb is the list of enabled types
    if (!this._config.enabledBreadcrumbTypes || !includes(this._config.enabledBreadcrumbTypes, type)) return

    const crumb = new Breadcrumb(message, metadata, type)

    // run onBreadcrumb callbacks
    const ignore = runSyncCallbacks(this._cbs.b, crumb, 'onBreadcrumb', this._logger)

    if (ignore) {
      this._logger.debug('Breadcrumb not attached due to onBreadcrumb callback')
      return
    }

    // push the valid crumb onto the queue and maintain the length
    this._breadcrumbs.push(crumb)
    if (this._breadcrumbs.length > this._config.maxBreadcrumbs) {
      this._breadcrumbs = this._breadcrumbs.slice(this._breadcrumbs.length - this._config.maxBreadcrumbs)
    }
  }

  notify (maybeError, onError, cb = noop) {
    const event = Event.create(maybeError, true, undefined, 'notify()', this._depth + 1, this._logger)
    this._notify(event, onError, cb)
  }

  _notify (event, onError, cb = noop) {
    event.app = {
      ...event.app,
      releaseStage: this._config.releaseStage,
      version: this._config.appVersion,
      type: this._config.appType
    }
    event.context = event.context || this._context
    event._metadata = { ...event._metadata, ...this._metadata }
    event._user = { ...event._user, ...this._user }
    event.breadcrumbs = this._breadcrumbs.slice()

    if (this._session) {
      this._session._track(event)
      event._session = this._session
    }

    // exit early if events should not be sent on the current releaseStage
    if (this._config.enabledReleaseStages.length > 0 && !includes(this._config.enabledReleaseStages, this._config.releaseStage)) {
      this._logger.warn('Event not sent due to releaseStage/enabledReleaseStages configuration')
      return cb(null, event)
    }

    const originalSeverity = event.severity

    const onCallbackError = err => {
      // errors in callbacks are tolerated but we want to log them out
      this._logger.error('Error occurred in onError callback, continuing anyway…')
      this._logger.error(err)
    }

    const callbacks = [].concat(this._cbs.e).concat(onError)
    runCallbacks(callbacks, event, onCallbackError, (err, shouldSend) => {
      if (err) onCallbackError(err)

      if (!shouldSend) {
        this._logger.debug('Event not sent due to onError callback')
        return cb(null, event)
      }

      // only leave a crumb for the error if actually got sent
      Client.prototype.leaveBreadcrumb.call(this, event.errors[0].errorClass, {
        errorClass: event.errors[0].errorClass,
        errorMessage: event.errors[0].errorMessage,
        severity: event.severity
      }, 'error')

      if (originalSeverity !== event.severity) {
        event._handledState.severityReason = { type: 'userCallbackSetSeverity' }
      }

      this._delivery.sendEvent({
        apiKey: event.apiKey || this._config.apiKey,
        notifier: this._notifier,
        events: [event]
      }, (err) => cb(err, event))
    })
  }
}

const generateConfigErrorMessage = errors =>
  `Bugsnag configuration error\n${map(errors, (err) => `"${err.key}" ${err.message} \n    got ${stringify(err.value)}`).join('\n\n')}`

const stringify = val => typeof val === 'object' ? JSON.stringify(val) : String(val)

module.exports = Client
