import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'

export class AppJsHandledScenario extends Scenario {
  constructor (configuration, jsConfig) {
    super()
    configuration.appVersion = '1.2.3'
    jsConfig.codeBundleId = '1.2.3-r00110011'
  }

  run () {
    Bugsnag.notify(new Error('AppJsHandledScenario'))
  }
}
