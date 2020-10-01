const cuid = require('@bugsnag/cuid')
const assign = require('@bugsnag/core/lib/es-utils/assign')
const BUGSNAG_ANONYMOUS_ID_KEY = 'bugsnag-anonymous-id'

const getDeviceId = () => {
  try {
    const storage = window.localStorage

    let id = storage.getItem(BUGSNAG_ANONYMOUS_ID_KEY)

    // If we get an ID, make sure it looks like a valid cuid. The length can
    // fluctuate slightly, so some leeway is built in
    if (id && /^c[a-z0-9]{20,32}$/.test(id)) {
      return id
    }

    id = cuid()

    storage.setItem(BUGSNAG_ANONYMOUS_ID_KEY, id)

    return id
  } catch (err) {
    // If localStorage is not available (e.g. because it's disabled) then give up
  }
}

/*
 * Automatically detects browser device details
 */
module.exports = (nav = navigator, screen = window.screen) => ({
  load: (client) => {
    const device = {
      locale: nav.browserLanguage || nav.systemLanguage || nav.userLanguage || nav.language,
      userAgent: nav.userAgent
    }

    if (screen && screen.orientation && screen.orientation.type) {
      device.orientation = screen.orientation.type
    } else {
      device.orientation =
        document.documentElement.clientWidth > document.documentElement.clientHeight
          ? 'landscape'
          : 'portrait'
    }

    if (client._config.generateAnonymousId) {
      device.id = getDeviceId()
    }

    client.addOnSession(session => {
      session.device = assign({}, session.device, device)
    })

    // add time just as the event is sent
    client.addOnError((event) => {
      event.device = assign({},
        event.device,
        device,
        { time: new Date() }
      )
    }, true)
  },
  configSchema: {
    generateAnonymousId: {
      validate: value => value === true || value === false,
      defaultValue: () => true,
      message: 'should be true|false'
    }
  }
})
