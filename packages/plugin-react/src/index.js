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
        const { beforeSend } = this.props
        const BugsnagReport = client.BugsnagReport
        const handledState = { severity: 'error', unhandled: true, severityReason: { type: 'unhandledException' } }
        const report = new BugsnagReport(error.name, error.message, BugsnagReport.getStacktrace(error), handledState)
        if (info && info.componentStack) info.componentStack = formatComponentStack(info.componentStack)
        report.updateMetaData('react', info)
        client.notify(report, { beforeSend })
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
module.exports['default'] = module.exports
