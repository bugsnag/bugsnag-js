import bugsnag from '@bugsnag/browser';

var ENDPOINT = decodeURIComponent(window.location.search.match(/ENDPOINT=(.+)/)[1])

const bugsnagClient = bugsnag({
  apiKey: 'ABC',
  endpoints: {
    notify: ENDPOINT
  },
  beforeSend: (report) => {
    var el = document.getElementById('bugsnag-test-state')
    el.textContent = el.innerText = 'DONE'
  }
});

export default bugsnagClient;
