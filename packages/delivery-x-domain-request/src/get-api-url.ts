import { Config } from '@bugsnag/core'
import matchPageProtocol from './match-page-protocol'

const getApiUrl = (config: Required<Config>, endpoint: 'notify' | 'sessions', version: string, win: Window & typeof globalThis) => {
  // IE8 doesn't support Date.prototype.toISOstring(), but it does convert a date
  // to an ISO string when you use JSON stringify. Simply parsing the result of
  // JSON.stringify is smaller than using a toISOstring() polyfill.
  const isoDate = JSON.parse(JSON.stringify(new Date()))
  const url = matchPageProtocol(config.endpoints[endpoint], win.location.protocol)
  return `${url}?apiKey=${encodeURIComponent(config.apiKey)}&payloadVersion=${version}&sentAt=${encodeURIComponent(isoDate)}`
}

export default getApiUrl
