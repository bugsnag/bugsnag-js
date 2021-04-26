/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/application-architecture#main-and-renderer-processes
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import './index.css';
import Bugsnag from '@bugsnag/electron'

Bugsnag.start()

console.log('👋 This message is being logged by "renderer.js", included via webpack');

document.getElementById('rendererHandled').onclick = () => {
  Bugsnag.notify(new Error('handled error in renderer'))
}

document.getElementById('rendererUnhandled').onclick = () => {
  throw new Error('unhandled error in renderer')
}

document.getElementById('rendererRejection').onclick = () => {
  Promise.reject(new Error('unhandled promise rejection in renderer'))
}

document.getElementById('mainHandled').onclick = () => {
  __bugsnag_example_ipc__.sendMainHandled()
}

document.getElementById('mainUnhandled').onclick = () => {
  __bugsnag_example_ipc__.sendMainUnhandled()
}

document.getElementById('mainRejection').onclick = () => {
  __bugsnag_example_ipc__.sendMainRejection()
}
