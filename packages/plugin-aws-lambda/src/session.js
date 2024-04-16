// const clone = require('@bugsnag/core/lib/clone-client')
const BugsnagPluginBrowserSession = require('@bugsnag/plugin-browser-session')
// const isServerPluginLoaded = require('./is-server-plugin-loaded')

module.exports = {
  load: client => {
    client._loadPlugin(BugsnagPluginBrowserSession)

    // const oldStartSession = client._sessionDelegate.startSession

    // // clone the client when startSession is called if a server plugin is loaded
    // client._sessionDelegate.startSession = function (client, session) {
    //   const maybeCloned = isServerPluginLoaded(client) ? clone(client) : client

    //   return oldStartSession(maybeCloned, session)
    // }
  }
}
