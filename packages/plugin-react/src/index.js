module.exports = class BugsnagReactPlugin {
  constructor (React = window.React) {
    if (!React) throw new Error('cannot find React')
    this.React = React
    this.name = 'react'
  }

  load (client) {
    const React = this.React

    class ErrorBoundary extends React.Component {
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
    return ErrorBoundary
  }
}

const formatComponentStack = str => {
  const lines = str.split(/\s*\n\s*/g)
  let ret = ''
  for (let line = 0, len = lines.length; line < len; line++) {
    if (lines[line].length) ret += `${ret.length ? '\n' : ''}${lines[line]}`
  }
  return ret
}

module.exports.formatComponentStack = formatComponentStack
module.exports.default = module.exports
