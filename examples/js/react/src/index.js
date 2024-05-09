import Bugsnag from '@bugsnag/js'
import BugsnagPluginReact from '@bugsnag/plugin-react'
import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './App'

Bugsnag.start({
  apiKey: 'a3246c88da8cbd540f9c3976967208cd',
  plugins: [new BugsnagPluginReact(React)],
  appVersion: '1.2.3',
})

const ErrorBoundary = Bugsnag.getPlugin('react')

const ErrorScreen = ({ clearError }) =>
  <div>
    <h1>⚠️ Error ⚠️</h1>
    <p><strong>Uh oh, there was an error in the component tree!</strong></p>
    <p>This <code>FallbackComponent</code> prop can be used to show something useful to your users when such errors occur.</p>
    <button onClick={clearError}>Reset</button>
  </div>

const onError = event => {
  // You can also provide an onError callback to run just on errors caught by
  // the error boundary. Maybe you want to attach some of the current state from
  // whatever model/store you're using (e.g redux)
  console.log('about to send this event', { event })
}

ReactDOM.render(
  <ErrorBoundary FallbackComponent={ErrorScreen} onError={onError}>
    <App />
  </ErrorBoundary>,
  document.getElementById('root')
)
