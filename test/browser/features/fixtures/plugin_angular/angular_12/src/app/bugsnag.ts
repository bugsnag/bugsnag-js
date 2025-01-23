import Bugsnag from '@bugsnag/js';

const NOTIFY = decodeURIComponent(window.location.search.match(/NOTIFY=([^&]+)/)?.[1] || '')
const SESSIONS = decodeURIComponent(window.location.search.match(/SESSIONS=([^&]+)/)?.[1] || '')
const API_KEY = decodeURIComponent(window.location.search.match(/API_KEY=([^&]+)/)?.[1] || '')

const bugsnagClient = Bugsnag.createClient({
  apiKey: API_KEY,
  endpoints: {
    notify: NOTIFY,
    sessions: SESSIONS
  },
  onError: (event) => {
  }
});

export default bugsnagClient;
