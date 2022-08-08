import { Plugin, OnErrorCallback } from '@bugsnag/core'
import React from 'react'

declare class BugsnagPluginReact extends Plugin {
  constructor(R?: typeof React)
}

export type BugsnagErrorBoundary = React.ComponentType<{
  children?: React.ReactNode | undefined
  onError?: OnErrorCallback
  FallbackComponent?: React.ComponentType<{
    error: Error
    info: React.ErrorInfo
    clearError: () => void
  }>
}>

export interface BugsnagPluginReactResult {
  createErrorBoundary(react?: typeof React): BugsnagErrorBoundary
}

// add a new call signature for the getPlugin() method that types the react plugin result
declare module '@bugsnag/core' {
  interface Client {
    getPlugin(id: 'react'): BugsnagPluginReactResult | undefined
  }
}

export default BugsnagPluginReact
