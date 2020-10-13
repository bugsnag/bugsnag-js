import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'

export class AppConfigReleaseStageScenario extends Scenario {
  constructor (configuration, extraData, jsConfig) {
    super()
    configuration.releaseStage = 'staging'
  }

  run () {
    Bugsnag.notify(new Error('AppConfigReleaseStageScenario'))
  }
}
