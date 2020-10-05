import React from 'react'
import Bugsnag from '@bugsnag/js'
import BugsnagPluginReact from '@bugsnag/plugin-react'
import getConfig from 'next/config'
const { serverRuntimeConfig, publicRuntimeConfig } = getConfig()

// If you only leverage Bugsnag on the client.
// if (!Bugsnag._client) {
//   Bugsnag.start({
//     apiKey: serverRuntimeConfig.BUGSNAG_API_KEY || publicRuntimeConfig.BUGSNAG_API_KEY,
//     plugins: [new BugsnagPluginReact(React)]
//   });
// }

Bugsnag.start({
  apiKey: serverRuntimeConfig.BUGSNAG_API_KEY || publicRuntimeConfig.BUGSNAG_API_KEY,
  plugins: [new BugsnagPluginReact(React)]
})

export default Bugsnag
