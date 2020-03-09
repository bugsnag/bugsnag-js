import { Plugin } from '@bugsnag/browser'
import React from 'react'

declare class BugsnagPluginReact extends Plugin {
  constructor(React?: React)
}

export default BugsnagPluginReact
