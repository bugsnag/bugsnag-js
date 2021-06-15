import React from 'react'

type OnErrorCallback = (event: any, cb: (err: null | Error, shouldSend?: boolean) => void) => void | boolean | Promise<void | boolean>
type NotifiableError = Error
| { errorClass: string, errorMessage: string }
| { name: string, message: string }
| string

interface ClientThatReactNeeds {
  notify(
    error: NotifiableError,
    onError?: OnErrorCallback,
    cb?: (err: any, event: any) => void
  ): void
}

declare class BugsnagPluginReact {
  constructor(react?: typeof React)
  load(client: ClientThatReactNeeds): BugsnagPluginReactResult
}

export type BugsnagErrorBoundary = React.ComponentType<{
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
