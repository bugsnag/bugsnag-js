import Bugsnag from '@bugsnag/browser'
import config from './lib/config'

Bugsnag.init(config)

Bugsnag.notify(new Error('bad things'))
