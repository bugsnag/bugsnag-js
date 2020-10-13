import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'

export class UserJsConfigScenario extends Scenario {
  constructor (configuration, extraData, jsConfig) {
    super()
    jsConfig.user = {
      id: '123',
      email: 'bug@sn.ag',
      name: 'Bug Snag'
    }
  }

  run () {
    Bugsnag.notify(new Error('UserJsConfigScenario'))
  }
}
