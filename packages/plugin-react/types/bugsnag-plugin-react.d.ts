import { Plugin } from '@bugsnag/core'
import React from 'react'

declare class BugsnagPluginReact extends Plugin {
  constructor(R?: typeof React)
}

export default BugsnagPluginReact
