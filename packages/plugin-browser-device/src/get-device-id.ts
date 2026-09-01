import cuid from '@bugsnag/cuid'

const BUGSNAG_ANONYMOUS_ID_KEY = 'bugsnag-anonymous-id'

const getDeviceId = (win: Window) => {
  try {
    const storage = win.localStorage

    let id = storage.getItem(BUGSNAG_ANONYMOUS_ID_KEY)

    // If we get an ID, make sure it looks like a valid cuid
    if (id && cuid.isCuid(id)) {
      return id
    }

    id = cuid()

    storage.setItem(BUGSNAG_ANONYMOUS_ID_KEY, id)

    return id
  } catch (err) {
    // If localStorage is not available (e.g. because it's disabled) then give up
  }
}

export default getDeviceId
