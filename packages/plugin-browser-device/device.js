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

    // merge with anything already set on the client
    client.device = { ...device, ...client.device }

    // add time just as the event is sent
    client._config.onError.unshift((event) => {
      event.device = { ...event.device, time: isoDate() }
    })
  }
}
