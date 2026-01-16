import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'

export class UserJsClientScenario extends Scenario {
  run () {
    Bugsnag.setUser('123', 'bug@sn.ag', 'Bug Snag')
    Bugsnag.notify(new Error('UserJsClientScenario'))
  }
}
