import Bugsnag from '@bugsnag/browser'
import ReactDOM from 'react-dom'
import React, { useEffect } from 'react'
import { apiKey, endpoints, plugins, REFLECT_ENDPOINT } from './lib/config'

Bugsnag.start({ apiKey, endpoints, plugins, redactedKeys: ['token'] })

function App () {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const type = params.get('request') === 'xhr' ? 'xhr' : 'fetch'

    switch(type) {
      case 'xhr':
        const xhr = new XMLHttpRequest()
        xhr.open('GET', `${REFLECT_ENDPOINT}?status=404&token=12345`)
        xhr.send()
        break
      case 'fetch':
      default:
        fetch(`${REFLECT_ENDPOINT}?status=404&token=12345`)
        break
    }

  }, [])

  return (
    <div>
      <p>HTTP Errors - fetch</p>
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
