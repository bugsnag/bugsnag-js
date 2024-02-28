import * as React from "react"
import Bugsnag from '@bugsnag/js'

class BadButtons extends React.Component<{}, {yeah: boolean}> {
    constructor (props: {} | Readonly<{}>) {
      super(props)
      this.state = { yeah: false }
    }

    triggerRenderError = () => {
        this.setState({ yeah: true })
    }

    render() {
        return (
            <div>
                <button title={"handled error"} onClick={handledError}>Throw a handled error</button>
                <button title={"unhandled error"} onClick={unhandledError}>Throw an unhandled error</button>
                <button title={"Render error"} onClick={this.triggerRenderError}>Throw a render error</button>
                {this.state.yeah ? <span>{ this.state.yeah.non.existent.property }</span> : null}
            </div>
        )  
    }
}

function unhandledError() {
    throw new Error('Unhandled error!')
}
  
function handledError() {
    Bugsnag.notify(new Error('Handled error!'))
}

export default BadButtons