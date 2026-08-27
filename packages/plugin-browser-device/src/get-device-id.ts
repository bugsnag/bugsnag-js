import cuid from '@bugsnag/cuid'

const BUGSNAG_ANONYMOUS_ID_KEY = 'bugsnag-anonymous-id'

const getDeviceId = (win: Window) => {
  try {
    const storage = win.localStorage

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

export default getDeviceId
