import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'

export class UserJsConfigScenario extends Scenario {
  constructor (configuration, jsConfig) {
    super()
    jsConfig.user = {
      id: '123',
      email: 'bug@sn.ag',
      name: 'Bug Snag'
    }
  }

  run () {
    setTimeout(() => {
      Bugsnag.notify(new Error('UserJsConfigScenario'))
    }, 100)
  }
}
