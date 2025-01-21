import Bugsnag from '@bugsnag/js';

var NOTIFY = decodeURIComponent(window.location.search.match(/NOTIFY=([^&]+)/)[1])
var SESSIONS = decodeURIComponent(window.location.search.match(/SESSIONS=([^&]+)/)[1])
var API_KEY = decodeURIComponent(window.location.search.match(/API_KEY=([^&]+)/)[1])

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
