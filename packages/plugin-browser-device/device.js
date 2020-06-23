const assign = require('@bugsnag/core/lib/es-utils/assign')

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
