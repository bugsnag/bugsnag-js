var NOTIFY = decodeURIComponent((<Array<string>>window.location.search.match(/NOTIFY=([^&]+)/))[1])
var SESSIONS = decodeURIComponent((<Array<string>>window.location.search.match(/SESSIONS=([^&]+)/))[1])
var API_KEY = decodeURIComponent((<Array<string>>window.location.search.match(/API_KEY=([^&]+)/))[1])
const config = { endpoints: { notify: NOTIFY, sessions: SESSIONS }, apiKey: API_KEY }
export default config
