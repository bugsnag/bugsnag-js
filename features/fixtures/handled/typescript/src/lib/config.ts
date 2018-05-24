const ENDPOINT = decodeURIComponent((<Array<string>>window.location.search.match(/ENDPOINT=(.+)/))[1])
const config = { endpoint: ENDPOINT, apiKey: 'ABC' }
export default config
