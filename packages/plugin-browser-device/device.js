const assign = require('@bugsnag/core/lib/es-utils/assign')

/*
 * Automatically detects browser device details
 */
module.exports = (nav = navigator, _screen = window.screen) => ({
  load: (client) => {
    const device = {
      locale: nav.browserLanguage || nav.systemLanguage || nav.userLanguage || nav.language,
      userAgent: nav.userAgent
    }

    if (_screen && _screen.orientation && _screen.orientation.type) {
      device.orientation = _screen.orientation.type
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
  }
})
