import bugsnag from '@bugsnag/browser'
import config from './lib/config'

var bugsnagClient = bugsnag(config)

go()
  .then(function () {})
  .catch(function (e: any) {
    bugsnagClient.notify(e)
  })

function go() {
  return Promise.reject(new Error('bad things'))
}
