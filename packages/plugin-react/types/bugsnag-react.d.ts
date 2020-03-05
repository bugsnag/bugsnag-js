import { Bugsnag } from '@bugsnag/browser'
import React from 'react'

declare class BugsnagPluginReact extends Bugsnag.Plugin {
  constructor(React?: React)
}

export default BugsnagPluginReact
