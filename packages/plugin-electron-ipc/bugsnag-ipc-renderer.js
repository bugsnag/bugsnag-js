const { ipcRenderer } = require('electron')
const jsonStringify = require('@bugsnag/safe-json-stringify')
const { CHANNEL_RENDERER_TO_MAIN, CHANNEL_RENDERER_TO_MAIN_SYNC } = require('./lib/constants')

const safeInvoke = (runSynchronous, method, ...args) => {
  const bridge = runSynchronous ? 'sendSync' : 'invoke'
  const channel = runSynchronous ? CHANNEL_RENDERER_TO_MAIN_SYNC : CHANNEL_RENDERER_TO_MAIN
  return ipcRenderer[bridge](channel, method, ...args.map(arg => jsonStringify(arg)))
}

const BugsnagIpcRenderer = {
  // these static values are populated by preload.js
  config: null,
  process: null,

  update ({ context, user, metadata, features }) {
    return safeInvoke(false, 'update', { context, user, metadata, features })
  },

  getContext () {
    return safeInvoke(true, 'getContext')
  },

  setContext (context) {
    return safeInvoke(false, 'setContext', context)
  },

  getGroupingDiscriminator () {
    return safeInvoke(true, 'getGroupingDiscriminator')
  },

  setGroupingDiscriminator (groupingDiscriminator) {
    return safeInvoke(false, 'setGroupingDiscriminator', groupingDiscriminator)
  },

  addMetadata (...args) {
    return safeInvoke(false, 'addMetadata', ...args)
  },

  clearMetadata (...args) {
    return safeInvoke(false, 'clearMetadata', ...args)
  },

  getMetadata (...args) {
    return safeInvoke(true, 'getMetadata', ...args)
  },

  addFeatureFlag (...args) {
    return safeInvoke(false, 'addFeatureFlag', ...args)
  },

  addFeatureFlags (...args) {
    return safeInvoke(false, 'addFeatureFlags', ...args)
  },

  clearFeatureFlag (...args) {
    return safeInvoke(false, 'clearFeatureFlag', ...args)
  },

  clearFeatureFlags () {
    return safeInvoke(false, 'clearFeatureFlags')
  },

  getUser () {
    return safeInvoke(true, 'getUser')
  },

  setUser (...args) {
    return safeInvoke(false, 'setUser', ...args)
  },

  leaveBreadcrumb (...args) {
    return safeInvoke(false, 'leaveBreadcrumb', ...args)
  },

  startSession () {
    return safeInvoke(false, 'startSession')
  },

  pauseSession () {
    return safeInvoke(false, 'pauseSession')
  },

  resumeSession () {
    return safeInvoke(false, 'resumeSession')
  },

  dispatch (event) {
    return safeInvoke(false, 'dispatch', event)
  },

  getPayloadInfo () {
    return safeInvoke(false, 'getPayloadInfo')
  }
}

module.exports = BugsnagIpcRenderer
