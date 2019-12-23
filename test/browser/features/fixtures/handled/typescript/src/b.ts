declare var foo: any

import Bugsnag from '@bugsnag/browser'
import config from './lib/config'

Bugsnag.init(config)

try {
  foo.bar()
} catch (e) {
  Bugsnag.notify(e)
}
