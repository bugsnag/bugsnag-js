import bugsnag from '@bugsnag/browser'
import config from './lib/config'

var bugsnagClient = bugsnag(config)

bugsnagClient.notify(new Error('bad things'))
