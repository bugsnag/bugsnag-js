/*
 * Automatically detects browser device details
 */
module.exports = {
  load: (client) => {
    const device = {
      locale: navigator.browserLanguage || navigator.systemLanguage || navigator.userLanguage || navigator.language,
      userAgent: navigator.userAgent
    }

    client.addOnSession(session => {
      session.device = { ...session.device, ...device }
      // only set device id if collectUserIp is false
      if (!client._config.collectUserIp) setDefaultUserId(session)
    })

    // add time just as the event is sent
    client.addOnError((event) => {
      event.device = {
        ...event.device,
        ...device,
        time: new Date()
      }
      if (!client._config.collectUserIp) setDefaultUserId(event)
    }, true)
  },
  configSchema: {
    generateAnonymousId: {
      validate: value => value === true || value === false,
      defaultValue: () => true,
      message: 'should be true|false'
    }
  }
}

const setDefaultUserId = (eventOrSession) => {
  // device id is also used to populate the user id field, if it's not already set
  const user = eventOrSession.getUser()
  if (!user || !user.id) {
    eventOrSession.setUser(eventOrSession.device.id)
  }
}
