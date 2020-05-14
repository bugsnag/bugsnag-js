import Bugsnag from '@bugsnag/js'
import React from 'react'

class BadButtons extends React.Component {
  constructor (props) {
    super(props)
    this.state = { doARenderError: false }
  }

  throwError (unhandled = false) {
    if (unhandled) throw new Error('Bad Thing!')
    try {
      // potentially buggy code goes here
      // for this example, we're just throwing an error explicitly, but you do not need this syntax in your try clause.
      throw new Error('Bad Thing!')
    } catch (e) {
      console.log('a handled error was sent to our dashboard.')
      Bugsnag.notify(e, event => {
        event.context = 'Don’t worry - I handled it.'
      })
    }
  }

  triggerRenderError () {
    this.setState({ yeah: true })
  }

  render () {
    return (
      <div id='buttons'>
        <h3>Send some errors by clicking below:</h3>
        <button onClick={() => this.throwError()}>Send handled</button>
        <button onClick={() => this.throwError(true)}>Send unhandled</button>
        <button onClick={() => this.triggerRenderError()}>Trigger a render error</button>
        {this.state.yeah ? <span>{ this.state.yeah.non.existent.property }</span> : null}
      </div>
    )
  }
}

export default BadButtons
