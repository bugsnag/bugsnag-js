const { isoDate } = require('@bugsnag/core/lib/es-utils')

/*
 * Automatically detects browser device details
 */
module.exports = {
  init: (client, nav = navigator) => {
    const device = {
      locale: nav.browserLanguage || nav.systemLanguage || nav.userLanguage || nav.language,
      userAgent: nav.userAgent
    }

    // add time just as the event is sent
    client.addOnError((event) => {
      event.device = {
        ...event.device,
        ...device,
        time: isoDate()
      }
    }, true)
  }
}
