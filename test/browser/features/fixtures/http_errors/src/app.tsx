import Bugsnag from '@bugsnag/browser'
import ReactDOM from 'react-dom'
import React, { useEffect } from 'react'
import { apiKey, endpoints, plugins, REFLECT_ENDPOINT } from './lib/config'

Bugsnag.start({ apiKey, endpoints, plugins, redactedKeys: ['X-Token', 'userId'] })

function xhrGet () {
  const xhr = new XMLHttpRequest()
  xhr.open('GET', `${REFLECT_ENDPOINT}?status=404&userId=12345`)
  xhr.setRequestHeader('X-Token', 'super-secret-token')
  xhr.setRequestHeader('X-Test-Value', 'one-two')
  xhr.setRequestHeader('X-Test-Value', '-three-four')
  xhr.send()
}

function xhrPost () {
  const xhr = new XMLHttpRequest()
  xhr.open('POST', `${REFLECT_ENDPOINT}?status=403&userId=12345`)
  xhr.setRequestHeader('X-Token', 'super-secret-token')
  xhr.send('this is the request body')
}

function fetchGet () {
  fetch(`${REFLECT_ENDPOINT}?status=401&userId=12345`, { 
    headers: { 'x-token': 'super-secret-token' }
  })
}

function fetchPost () {
  fetch(`${REFLECT_ENDPOINT}?status=408&userId=12345`, { 
    method: 'POST',
    body: 'this is the request body',
    headers: { 'x-token': 'super-secret-token' }
  })
}

function App () {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    switch(params.get('request')) {
      case 'xhr':
      case 'xhr-get':
        xhrGet()
        break
      case 'xhr-post':
        xhrPost()
        break
      case 'fetch':
      case 'fetch-get':
        fetchGet()
        break
      case 'fetch-post':
        fetchPost()
        break
      default:
    }

  }, [])

  return (
    <div>
      <p>HTTP Errors</p>
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
