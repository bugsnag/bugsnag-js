import React from 'react'

export default class CrashyButton extends React.Component {
  constructor (props) {
    super(props)
    this.state = { badState: false }
  }

  doSomethingBad () {
    this.setState({ badState: true })
  }

  render () {
    return (
      <button onClick={this.doSomethingBad.bind(this)}>
        {this.state.badState ? <span>{this.state.badState.non.existent.property}</span> : null}
        {this.props.children}
      </button>
    )
  }
}
