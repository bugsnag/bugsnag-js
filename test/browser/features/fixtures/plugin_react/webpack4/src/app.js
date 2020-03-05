var Bugsnag = require('@bugsnag/browser')
var ReactDOM = require('react-dom')
var React = require('react')
var config = require('./lib/config')

Bugsnag.start(config)

var ErrorBoundary = Bugsnag.getPlugin('react')

function onError () {
}

function ErrorView () {
  return <p>There was an error</p>
}

function MainView () {
  return <p>Hello world<button>{text()}</button></p>
}

var text = function () { throw new Error('borked') }

function App () {
  return <ErrorBoundary FallbackComponent={ErrorView} onError={onError}>
    <MainView />
  </ErrorBoundary>
}

ReactDOM.render(<App />, document.getElementById('root'))
