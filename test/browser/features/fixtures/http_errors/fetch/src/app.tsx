import Bugsnag from '@bugsnag/browser'
import ReactDOM from 'react-dom'
import React, { useEffect } from 'react'
import { apiKey, endpoints, plugins, REFLECT_ENDPOINT } from './lib/config'

Bugsnag.start({ apiKey, endpoints, plugins })

function App () {
  useEffect(() => {
    fetch(`${REFLECT_ENDPOINT}?status=404`)
  }, [])

  return (
    <div>
      <p>HTTP Errors - fetch</p>
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
