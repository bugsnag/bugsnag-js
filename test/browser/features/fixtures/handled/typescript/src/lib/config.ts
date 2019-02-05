var ENDPOINT = decodeURIComponent((<Array<string>>window.location.search.match(/ENDPOINT=([^&]+)/))[1])
var API_KEY = decodeURIComponent((<Array<string>>window.location.search.match(/API_KEY=([^&]+)/))[1])
const config = { endpoint: ENDPOINT, apiKey: API_KEY }
export default config
