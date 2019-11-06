module.exports = {
  name: 'react',
  init: (client, React = window.React) => {
    if (!React) throw new Error('cannot find React')

    class ErrorBoundary extends React.Component {
      constructor (props) {
        super(props)
        this.state = {
          error: null,
          info: null
        }
      }

      componentDidCatch (error, info) {
        const { onError } = this.props
        const handledState = { severity: 'error', unhandled: true, severityReason: { type: 'unhandledException' } }
        const event = new client.Event(error.name, error.message, client.Event.getStacktrace(error), error, handledState)
        client._notify(event, [
          event => {
            if (info && info.componentStack) info.componentStack = formatComponentStack(info.componentStack)
            event.addMetadata('react', info)
          }
        ].concat(onError))
        this.setState({ error, info })
      }

      render () {
        const { error } = this.state
        if (error) {
          const { FallbackComponent } = this.props
          if (FallbackComponent) return React.createElement(FallbackComponent, this.state)
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
