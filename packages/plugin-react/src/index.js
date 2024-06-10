module.exports = class BugsnagPluginReact {
  constructor (...args) {
    // Fetch React from the window object, if it exists
    const globalReact = typeof window !== 'undefined' && window.React

    this.name = 'react'
    this.lazy = args.length === 0 && !globalReact

    if (!this.lazy) {
      this.React = args[0] || globalReact
      if (!this.React) throw new Error('@bugsnag/plugin-react reference to `React` was undefined')
    }
  }

  load (client) {
    if (!this.lazy) {
      const ErrorBoundary = createClass(this.React, client)
      ErrorBoundary.createErrorBoundary = () => ErrorBoundary
      return ErrorBoundary
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
    BugsnagPluginReactLazyInitializer.createErrorBoundary = (React) => {
      if (!React) throw new Error('@bugsnag/plugin-react reference to `React` was undefined')
      return createClass(React, client)
    }
    return BugsnagPluginReactLazyInitializer
  }
}

const formatComponentStack = str => {
  const lines = str.split(/\n/g)
  let ret = ''
  for (let line = 0, len = lines.length; line < len; line++) {
    if (lines[line].length) ret += `${ret.length ? '\n' : ''}${lines[line].trim()}`
  }
  return ret
}

const createClass = (React, client) => class ErrorBoundary extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      error: null,
      info: null
    }
    this.handleClearError = this.handleClearError.bind(this)
  }

  handleClearError () {
    this.setState({ error: null, info: null })
  }

  componentDidCatch (error, info) {
    const { onError } = this.props
    const handledState = { severity: 'error', unhandled: true, severityReason: { type: 'unhandledException' } }
    const event = client.Event.create(
      error,
      true,
      handledState,
      1
    )
    if (info && info.componentStack) info.componentStack = formatComponentStack(info.componentStack)
    event.addMetadata('react', info)
    client._notify(event, onError)
    this.setState({ error, info })
  }

  render () {
    const { error } = this.state
    if (error) {
      const { FallbackComponent } = this.props
      if (FallbackComponent) return React.createElement(FallbackComponent, { ...this.state, clearError: this.handleClearError })
      return null
    }
    return this.props.children
  }
}

module.exports.formatComponentStack = formatComponentStack
module.exports.default = module.exports
