const config = require('./config')
const Event = require('./event')
const Breadcrumb = require('./breadcrumb')
const Session = require('./session')
const map = require('./lib/es-utils/map')
const includes = require('./lib/es-utils/includes')
const filter = require('./lib/es-utils/filter')
const reduce = require('./lib/es-utils/reduce')
const keys = require('./lib/es-utils/keys')
const assign = require('./lib/es-utils/assign')
const runCallbacks = require('./lib/callback-runner')
const featureFlagDelegate = require('./lib/feature-flag-delegate')
const metadataDelegate = require('./lib/metadata-delegate')
const runSyncCallbacks = require('./lib/sync-callback-runner')
const BREADCRUMB_TYPES = require('./lib/breadcrumb-types')

const noop = () => {}

class Client {
  constructor (configuration, schema = config.schema, internalPlugins = [], notifier) {
    // notifier id
    this._notifier = notifier

    // intialise opts and config
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
    this._features = {}
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

    this._config = this._configure(configuration, internalPlugins)
    map(internalPlugins.concat(this._config.plugins), pl => {
      if (pl) this._loadPlugin(pl)
    })

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
    featureFlagDelegate.add(this._features, name, variant)
  }

  addFeatureFlags (featureFlags) {
    featureFlagDelegate.merge(this._features, featureFlags)
  }

  clearFeatureFlag (name) {
    delete this._features[name]
  }

  clearFeatureFlags () {
    this._features = {}
  }

  getContext () {
    return this._context
  }

  setContext (c) {
    this._context = c
  }

  _configure (opts, internalPlugins) {
    const schema = reduce(internalPlugins, (schema, plugin) => {
      if (plugin && plugin.configSchema) return assign({}, schema, plugin.configSchema)
      return schema
    }, this._schema)

    // accumulate configuration and error messages
    const { errors, config } = reduce(keys(schema), (accum, key) => {
      const defaultValue = schema[key].defaultValue(opts[key])

      if (opts[key] !== undefined) {
        const valid = schema[key].validate(opts[key])
        if (!valid) {
          accum.errors[key] = schema[key].message
          accum.config[key] = defaultValue
        } else {
          if (schema[key].allowPartialObject) {
            accum.config[key] = assign(defaultValue, opts[key])
          } else {
            accum.config[key] = opts[key]
          }
        }
      } else {
        accum.config[key] = defaultValue
      }

      return accum
    }, { errors: {}, config: {} })

    if (schema.apiKey) {
      // missing api key is the only fatal error
      if (!config.apiKey) throw new Error('No Bugsnag API Key set')
      // warn about an apikey that is not of the expected format
      if (!/^[0-9a-f]{32}$/i.test(config.apiKey)) errors.apiKey = 'should be a string of 32 hexadecimal characters'
    }

    // update and elevate some options
    this._metadata = assign({}, config.metadata)
    featureFlagDelegate.merge(this._features, config.featureFlags)
    this._user = assign({}, config.user)
    this._context = config.context
    if (config.logger) this._logger = config.logger

    // add callbacks
    if (config.onError) this._cbs.e = this._cbs.e.concat(config.onError)
    if (config.onBreadcrumb) this._cbs.b = this._cbs.b.concat(config.onBreadcrumb)
    if (config.onSession) this._cbs.s = this._cbs.s.concat(config.onSession)

    // finally warn about any invalid config where we fell back to the default
    if (keys(errors).length) {
      this._logger.warn(generateConfigErrorMessage(errors, opts))
    }

    return config
  }

  getUser () {
    return this._user
  }

  setUser (id, email, name) {
    this._user = { id, email, name }
  }

  _loadPlugin (plugin) {
    const result = plugin.load(this)
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

    session.app.releaseStage = this._config.releaseStage
    session.app.version = this._config.appVersion
    session.app.type = this._config.appType

    session._user = assign({}, this._user)

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

  addOnBreadcrumb (fn, front = false) {
    this._cbs.b[front ? 'unshift' : 'push'](fn)
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
    type = (typeof type === 'string' && includes(BREADCRUMB_TYPES, type)) ? type : 'manual'
    metadata = typeof metadata === 'object' && metadata !== null ? metadata : {}

    // if no message, discard
    if (!message) return

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

  _isBreadcrumbTypeEnabled (type) {
    const types = this._config.enabledBreadcrumbTypes

    return types === null || includes(types, type)
  }

  notify (maybeError, onError, cb = noop) {
    const event = Event.create(maybeError, true, undefined, 'notify()', this._depth + 1, this._logger)
    this._notify(event, onError, cb)
  }

  _notify (event, onError, cb = noop) {
    event.app = assign({}, event.app, {
      releaseStage: this._config.releaseStage,
      version: this._config.appVersion,
      type: this._config.appType
    })
    event.context = event.context || this._context
    event._metadata = assign({}, event._metadata, this._metadata)
    event._features = assign({}, event._features, this._features)
    event._user = assign({}, event._user, this._user)
    event.breadcrumbs = this._breadcrumbs.slice()

    // exit early if events should not be sent on the current releaseStage
    if (this._config.enabledReleaseStages !== null && !includes(this._config.enabledReleaseStages, this._config.releaseStage)) {
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

      if (this._isBreadcrumbTypeEnabled('error')) {
        // only leave a crumb for the error if actually got sent
        Client.prototype.leaveBreadcrumb.call(this, event.errors[0].errorClass, {
          errorClass: event.errors[0].errorClass,
          errorMessage: event.errors[0].errorMessage,
          severity: event.severity
        }, 'error')
      }

      if (originalSeverity !== event.severity) {
        event._handledState.severityReason = { type: 'userCallbackSetSeverity' }
      }

      if (event.unhandled !== event._handledState.unhandled) {
        event._handledState.severityReason.unhandledOverridden = true
        event._handledState.unhandled = event.unhandled
      }

      if (this._session) {
        this._session._track(event)
        event._session = this._session
      }

      this._delivery.sendEvent({
        apiKey: event.apiKey || this._config.apiKey,
        notifier: this._notifier,
        events: [event]
      }, (err) => cb(err, event))
    })
  }
}

const generateConfigErrorMessage = (errors, rawInput) => {
  const er = new Error(
  `Invalid configuration\n${map(keys(errors), key => `  - ${key} ${errors[key]}, got ${stringify(rawInput[key])}`).join('\n\n')}`)
  return er
}

const stringify = val => {
  switch (typeof val) {
    case 'string':
    case 'number':
    case 'object':
      return JSON.stringify(val)
    default: return String(val)
  }
}

module.exports = Client
