var bugsnag = require('@bugsnag/browser')
var bugsnagReact = require('@bugsnag/plugin-react')
var React = require('react')
var ReactDOM = require('react-dom')
var config = require('./lib/config')

var bugsnagClient = bugsnag(config)
bugsnagClient.use(bugsnagReact, React)

var ErrorBoundary = bugsnagClient.getPlugin('react')

function beforeSend () {
  setTimeout(function () {
    var el = document.getElementById('bugsnag-test-state')
    el.textContent = el.innerText = 'DONE'
  }, 5000)
}

function ErrorView () {
  return <p>There was an error</p>
}

function MainView () {
  return <p>Hello world<button>{text()}</button></p>
}

var text = function () { throw new Error('borked') }

function App () {
  return <ErrorBoundary FallbackComponent={ErrorView} beforeSend={beforeSend}>
    <MainView />
  </ErrorBoundary>
}

ReactDOM.render(<App />, document.getElementById('root'))
