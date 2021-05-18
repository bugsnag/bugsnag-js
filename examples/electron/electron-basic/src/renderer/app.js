const Bugsnag = require('@bugsnag/electron')
Bugsnag.start()

document.getElementById('rendererHandled').onclick = () => {
  Bugsnag.notify(new Error('handled error in renderer'))
}

document.getElementById('rendererUnhandled').onclick = () => {
  throw new Error('unhandled error in renderer')
}

document.getElementById('rendererRejection').onclick = () => {
  Promise.reject(new Error('unhandled promise rejection in renderer'))
}

const { ipcRenderer } = require('electron')

document.getElementById('mainHandled').onclick = () => {
  ipcRenderer.send('bugsnag-handled-error')
}

document.getElementById('mainUnhandled').onclick = () => {
  ipcRenderer.send('bugsnag-unhandled-error')
}

document.getElementById('mainRejection').onclick = () => {
  ipcRenderer.send('bugsnag-promise-rejection')
}
