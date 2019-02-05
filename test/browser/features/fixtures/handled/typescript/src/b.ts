declare var foo: any

import bugsnag from '@bugsnag/browser'
import config from './lib/config'

var bugsnagClient = bugsnag(config)

try {
  foo.bar()
} catch (e) {
  bugsnagClient.notify(e)
}
