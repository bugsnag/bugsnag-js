import React, { ErrorInfo } from 'react'

import { Plugin, OnErrorCallback, Client } from '@bugsnag/core'

interface BugsnagErrorBoundaryProps {
  children?: React.ReactNode | undefined
  onError?: OnErrorCallback
  FallbackComponent?: React.ComponentType<{
    error: Error
    info: React.ErrorInfo
    clearError: () => void
  }>
}

export type BugsnagErrorBoundary = React.ComponentType<BugsnagErrorBoundaryProps>

export interface BugsnagPluginReactResult {
  createErrorBoundary(react?: typeof React): BugsnagErrorBoundary
}

// add a new call signature for the getPlugin() method that types the react plugin result
declare module '@bugsnag/core' {
  interface Client {
    getPlugin(id: 'react'): BugsnagPluginReactResult | undefined
  }
}

export default class BugsnagPluginReact implements Plugin {
  public readonly name: string;
  private readonly lazy: boolean;
  private readonly React?: typeof React

  constructor (react?: typeof React) {
    // Fetch React from the window object, if it exists
    const globalReact = typeof window !== 'undefined' && window.React

    this.name = 'react'
    this.lazy = !react && !globalReact

    if (!this.lazy) {
      this.React = react || globalReact as typeof React
      if (!this.React) throw new Error('@bugsnag/plugin-react reference to `React` was undefined')
    }
  }

  load (client: Client) {
    if (!this.lazy && this.React) {
      const ErrorBoundary = createClass(this.React, client)
      return { createErrorBoundary: () => ErrorBoundary }
    }

    const BugsnagPluginReactLazyInitializer = function () {
      throw new Error(`@bugsnag/plugin-react was used incorrectly. Valid usage is as follows:
Pass React to the plugin constructor

  \`Bugsnag.start({ plugins: [new BugsnagPluginReact(React)] })\`
and then call \`const ErrorBoundary = Bugsnag.getPlugin('react').createErrorBoundary()\`

Or if React is not available until after Bugsnag has started,
construct the plugin with no arguments
  \`Bugsnag.start({ plugins: [new BugsnagPluginReact()] })\`,
then pass in React when available to construct your error boundary
  \`const ErrorBoundary = Bugsnag.getPlugin('react').createErrorBoundary(React)\``)
    }
    BugsnagPluginReactLazyInitializer.createErrorBoundary = (react: typeof React) => {
      if (!react) throw new Error('@bugsnag/plugin-react reference to `React` was undefined')
      return createClass(react, client)
    }
    return BugsnagPluginReactLazyInitializer
  }
}

export const formatComponentStack = (str: string) => {
  const lines = str.split(/\n/g)
  let ret = ''
  for (let line = 0, len = lines.length; line < len; line++) {
    if (lines[line].length) ret += `${ret.length ? '\n' : ''}${lines[line].trim()}`
  }
  return ret
}

const createClass = (react: typeof React, client: Client) => class BugsnagErrorBoundary extends React.Component<BugsnagErrorBoundaryProps, { errorState: null | { error: Error, info: ErrorInfo }}> {
  constructor (props: BugsnagErrorBoundaryProps) {
    super(props)
    this.state = {
      errorState: null
    }
    this.handleClearError = this.handleClearError.bind(this)
  }

  handleClearError () {
    this.setState({ errorState: null })
  }

  componentDidCatch (error: Error, info: ErrorInfo) {
    const { onError } = this.props
    const handledState = { severity: 'error', unhandled: true, severityReason: { type: 'unhandledException' } }
    // @ts-ignore internal API
    const event = client.Event.create(
      error,
      true,
      handledState,
      1
    )
    if (info && info.componentStack) info.componentStack = formatComponentStack(info.componentStack)
    event.addMetadata('react', info)
    client._notify(event, onError)
    this.setState({ errorState: { error, info } })
  }

  render () {
    const { errorState } = this.state
    if (errorState) {
      const { FallbackComponent } = this.props
      if (FallbackComponent) return react.createElement(FallbackComponent, { ...errorState, clearError: this.handleClearError })
      return null
    }
    return this.props.children
  }
}
