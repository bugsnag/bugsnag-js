const NOTIFY = decodeURIComponent(window.location.search.match(/NOTIFY=([^&]+)/)![1])
const SESSIONS = decodeURIComponent(window.location.search.match(/SESSIONS=([^&]+)/)![1])
const API_KEY = decodeURIComponent(window.location.search.match(/API_KEY=([^&]+)/)![1])
const config = { endpoints: { notify: NOTIFY, sessions: SESSIONS }, apiKey: API_KEY }
export default config
