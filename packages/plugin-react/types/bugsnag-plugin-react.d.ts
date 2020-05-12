import { Plugin, Client } from '@bugsnag/core'
import React from 'react'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface BugsnagPluginReact extends Plugin { }
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
declare class BugsnagPluginReact {
  constructor(react?: typeof React)
}

interface BugsnagPluginReactResult {
  createErrorBoundary(react?: typeof React): React.Component
}

type ReactPluginId = 'react'
declare module '@bugsnag/core' {
  interface Client {
    getPlugin(id: ReactPluginId): BugsnagPluginReactResult | undefined
  }
}

export default BugsnagPluginReact
