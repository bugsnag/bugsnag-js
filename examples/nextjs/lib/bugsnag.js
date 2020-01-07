import React from 'react'
import Bugsnag from '@bugsnag/js'
import bugsnagReact from '@bugsnag/plugin-react'
import getConfig from 'next/config'
const { serverRuntimeConfig, publicRuntimeConfig } = getConfig()

Bugsnag.init({
  apiKey: serverRuntimeConfig.BUGSNAG_API_KEY || publicRuntimeConfig.BUGSNAG_API_KEY
})
Bugsnag.use(bugsnagReact, React)

export default Bugsnag
