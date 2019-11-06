import Bugsnag from '@bugsnag/browser';

var ENDPOINT = decodeURIComponent(window.location.search.match(/ENDPOINT=([^&]+)/)[1])
var API_KEY = decodeURIComponent(window.location.search.match(/API_KEY=([^&]+)/)[1])

const bugsnagClient = Bugsnag.createClient({
  apiKey: API_KEY,
  endpoints: {
    notify: ENDPOINT
  },
  onError: (event) => {
  }
});

export default bugsnagClient;
