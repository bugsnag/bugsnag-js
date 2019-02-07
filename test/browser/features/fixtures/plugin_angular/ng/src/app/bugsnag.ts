import bugsnag from '@bugsnag/browser';

var ENDPOINT = decodeURIComponent(window.location.search.match(/ENDPOINT=([^&]+)/)[1])
var API_KEY = decodeURIComponent(window.location.search.match(/API_KEY=([^&]+)/)[1])

const bugsnagClient = bugsnag({
  apiKey: API_KEY,
  endpoints: {
    notify: ENDPOINT
  },
  beforeSend: (report) => {
  }
});

export default bugsnagClient;
