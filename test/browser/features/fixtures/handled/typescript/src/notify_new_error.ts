import Bugsnag from '@bugsnag/browser'
import config from './lib/config'

Bugsnag.start(config)

Bugsnag.notify(new Error('bad things'))
