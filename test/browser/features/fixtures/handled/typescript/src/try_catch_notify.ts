declare var foo: any

import Bugsnag, { NotifiableError } from '@bugsnag/browser'
import config from './lib/config'

Bugsnag.start(config)

try {
  foo.bar()
} catch (e) {
  Bugsnag.notify(e as NotifiableError)
}
