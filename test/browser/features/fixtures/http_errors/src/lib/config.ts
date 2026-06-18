import { createNetworkInstrumentationPlugin } from '@bugsnag/plugin-network-instrumentation'

function getQueryParam (key: string): string {
  const match = window.location.search.match(new RegExp(key + '=([^&]+)'))
  return match ? decodeURIComponent(match[1]) : ''
}

export const apiKey = getQueryParam('API_KEY')

export const REFLECT_ENDPOINT = getQueryParam('REFLECT')

export const endpoints = {
  notify: getQueryParam('NOTIFY'),
  sessions: getQueryParam('SESSIONS')
}


export const plugins = [
  createNetworkInstrumentationPlugin({
    maxRequestSize: 5000,
    maxResponseSize: 5000
  })
]

