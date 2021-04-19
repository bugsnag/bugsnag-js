const Bugsnag = require('@bugsnag/electron')

Bugsnag.start()

function emulateOnlineStatus (online) {
  Object.defineProperty(window.navigator, 'onLine', { value: online, configurable: true })
  window.dispatchEvent(new window.Event(online ? 'online' : 'offline'))
}

document.getElementById('renderer-unhandled-promise-rejection').onclick = () => {
  Promise.reject(new TypeError('invalid'))
}

// eslint-disable-next-line
document.getElementById('renderer-uncaught-exception').onclick = () => foo()

document.getElementById('renderer-notify').onclick = () => {
  try {
    throw new Error('ALERT!')
  } catch (e) {
    Bugsnag.notify(e)
  }
}

document.getElementById('custom-breadcrumb').onclick = () =>
  Bugsnag.leaveBreadcrumb('missing auth token', { session: 'two-two' })

document.getElementById('emulate-offline').onclick = () => emulateOnlineStatus(false)
document.getElementById('emulate-online').onclick = () => emulateOnlineStatus(true)

document.getElementById('renderer-notify-on-error').onclick = () => {
  Bugsnag.notify(new Error('hi'), event => {
    event.addMetadata('onError', 'renderer', {
      // the payload assertion will check this value to ensure the onError callback did indeed run
      didRun: true,
      // these will be true if the render successfully got the app/device data in getPayloadData()
      didFindMainAppData: !!event.app && !!event.app.version && !!event.app.type && !!event.app.duration,
      didFindMainDeviceData: !!event.device && !!event.device.locale && !!event.device.freeMemory,
      // this should always be false because the main onError callbacks should run afterwards
      didFindMainOnErrorMetadata: event.getMetadata('app', 'part') === 3
    })
  })
}

document.getElementById('renderer-cancel-breadcrumbs').onclick = () => Bugsnag.addOnBreadcrumb(() => false)
