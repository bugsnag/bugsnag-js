var bugsnag = require('bugsnag-js')
var config = require('./lib/config')

var bugsnagClient = bugsnag(config)

bugsnagClient.notify(new Error('bad things'), {
  beforeSend: function () {
    setTimeout(function () {
      var el = document.getElementById('bugsnag-test-state')
      el.textContent = el.innerText = 'DONE'
    }, 5000)
  }
})
