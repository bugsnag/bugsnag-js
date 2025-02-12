const { Breadcrumb, Event, Session } = require('@bugsnag/core')

const supportedProperties = [
  'app',
  'breadcrumbs',
  'context',
  'device',
  'featureFlags',
  'groupingHash',
  'metaData',
  'request',
  'session',
  'severity',
  'unhandled',
  'user'
]

function hasValueForProperty (object, name) {
  if (!Object.prototype.hasOwnProperty.call(object, name)) {
    return false
  }

  const value = object[name]

  if (typeof value === 'undefined' || value === null) {
    return false
  }

  if (Array.isArray(value) && value.length === 0) {
    return false
  }

  if (typeof value === 'object' && Object.keys(value).length === 0) {
    return false
  }

  return true
}

function serialiseEvent (event) {
  const json = event.toJSON()
  const serialisedEvent = {}

  for (let i = 0; i < supportedProperties.length; ++i) {
    const property = supportedProperties[i]

    if (!hasValueForProperty(json, property)) {
      continue
    }

    // breadcrumbs and session information need to be encoded further
    if (property === 'breadcrumbs') {
      serialisedEvent.breadcrumbs = json.breadcrumbs.map(breadcrumb => breadcrumb.toJSON())
    } else if (property === 'session') {
      serialisedEvent.session = json.session.toJSON()
    } else if (property === 'metaData') {
      serialisedEvent.metadata = json[property]
    } else {
      serialisedEvent[property] = json[property]
    }
  }

  // set the severityReason if the severity was changed
  // 'severity' is not set by default so if it's present then the user must have
  // set it in a callback
  if (serialisedEvent.severity) {
    serialisedEvent.severityReason = { type: 'userCallbackSetSeverity' }
  }

  return serialisedEvent
}

function deserialiseEvent (json, minidumpPath) {
  if (!json || typeof json !== 'object') {
    return
  }

  const event = new Event('Native Crash', 'Event created for a native crash', [], {})

  if (hasValueForProperty(json, 'app')) {
    event.app = json.app
  }

  if (hasValueForProperty(json, 'breadcrumbs')) {
    event.breadcrumbs = json.breadcrumbs.map(
      breadcrumb => new Breadcrumb(
        breadcrumb.name,
        breadcrumb.metaData,
        breadcrumb.type,
        new Date(breadcrumb.timestamp)
      )
    )
  }

  if (hasValueForProperty(json, 'context')) {
    event.context = json.context
  }

  if (hasValueForProperty(json, 'device')) {
    event.device = json.device
  }

  if (hasValueForProperty(json, 'featureFlags')) {
    for (let i = 0; i < json.featureFlags.length; ++i) {
      const flag = json.featureFlags[i]

      event.addFeatureFlag(flag.featureFlag, flag.variant)
    }
  }

  if (hasValueForProperty(json, 'metadata')) {
    event._metadata = json.metadata
  }

  if (hasValueForProperty(json, 'session')) {
    const session = new Session()
    session.id = json.session.id
    session.startedAt = new Date(json.session.startedAt)
    session._handled = json.session.events.handled
    session._unhandled = json.session.events.unhandled

    event._session = session
  }

  if (hasValueForProperty(json, 'user')) {
    event._user = json.user
  }

  // this doesn't exist on the Event class, but could be helpful in onSendError
  // callbacks as it allows the user to find the related minidump
  event.minidumpPath = minidumpPath

  return event
}

module.exports = { serialiseEvent, deserialiseEvent }
