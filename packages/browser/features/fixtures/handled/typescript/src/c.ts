import bugsnag from '@bugsnag/browser'
import config from './lib/config'

var bugsnagClient = bugsnag(config)

go()
  .then(function () {})
  .catch(function (e: any) {
    bugsnagClient.notify(e, {
      beforeSend: function () {
        setTimeout(function () {
          var el = <HTMLPreElement>document.getElementById('bugsnag-test-state')
          el.textContent = el.innerText = 'DONE'
        }, 5000)
      }
    })
  })

function go() {
  return Promise.reject(new Error('bad things'))
}
