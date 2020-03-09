const assign = require('@bugsnag/core/lib/es-utils/assign')

/*
 * Automatically detects browser device details
 */
module.exports = (nav = navigator) => ({
  load: (client) => {
    const device = {
      locale: nav.browserLanguage || nav.systemLanguage || nav.userLanguage || nav.language,
      userAgent: nav.userAgent
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
