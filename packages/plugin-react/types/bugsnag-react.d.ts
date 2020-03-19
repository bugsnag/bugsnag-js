import { Plugin } from '@bugsnag/browser'
import React from 'react'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface BugsnagPluginReact extends Plugin { }
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
declare class BugsnagPluginReact {
  constructor(react?: typeof React)
}

export default BugsnagPluginReact
