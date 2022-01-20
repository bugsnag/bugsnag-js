import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'

export class UserJsEventScenario extends Scenario {
  constructor (configuration, jsConfig) {
    super()
  }

  run () {
    Bugsnag.notify(new Error('UserJsEventScenario'), event => {
      event.setUser('123', 'bug@sn.ag', 'Bug Snag')
    })
  }
}
