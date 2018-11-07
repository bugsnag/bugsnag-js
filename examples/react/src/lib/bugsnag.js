// this file instantiates one Bugsnag client for the entire application
// components and modules that want to send handled errors can import the
// exported client to send handled errors and components can get access to
// react ErrorBoundary by calling
//    const ErrorBoundary = bugsnagClient.getPlugin('react')

import bugsnag from '@bugsnag/js'
import bugsnagReact from '@bugsnag/plugin-react'
import React from 'react'

const bugsnagClient = bugsnag('YOUR_API_KEY')
  .use(bugsnagReact, React)

export default bugsnagClient
