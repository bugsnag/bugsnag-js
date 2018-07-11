declare var foo: any

import bugsnag from '@bugsnag/browser'
import config from './lib/config'

var bugsnagClient = bugsnag(config)

try {
  foo.bar()
} catch (e) {
  bugsnagClient.notify(e, {
    beforeSend: function () {
      setTimeout(function () {
        var el = <HTMLPreElement>document.getElementById('bugsnag-test-state')
        el.textContent = el.innerText = 'DONE'
      }, 5000)
    }
  })
}
