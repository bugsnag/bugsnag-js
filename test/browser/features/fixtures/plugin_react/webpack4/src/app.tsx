import Bugsnag from '@bugsnag/browser'
import ReactDOM from 'react-dom'
import React from 'react'
import { apiKey, endpoints, plugins } from './lib/config'

Bugsnag.start({ apiKey, endpoints, plugins })

var ErrorBoundary = Bugsnag.getPlugin('react')!.createErrorBoundary();

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
