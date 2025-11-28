import BugsnagPluginHttpErrors from '@bugsnag/plugin-http-errors'

function getQueryParam (key: string): string {
  const match = window.location.search.match(new RegExp(key + '=([^&]+)'))
  return match ? decodeURIComponent(match[1]) : ''
}

export const apiKey = getQueryParam('API_KEY')

export const endpoints = {
  notify: getQueryParam('NOTIFY'),
  sessions: getQueryParam('SESSIONS')
}

export const plugins = [
  BugsnagPluginHttpErrors()
]
