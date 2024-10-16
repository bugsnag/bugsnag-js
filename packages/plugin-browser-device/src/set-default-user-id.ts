import type { Event, Session } from '@bugsnag/core'

const setDefaultUserId = (eventOrSession: Event | Session) => {
  // device id is also used to populate the user id field, if it's not already set
  const user = eventOrSession.getUser()
  if ((!user || !user.id) && eventOrSession.device) {
    eventOrSession.setUser(eventOrSession.device.id)
  }
}

export default setDefaultUserId
