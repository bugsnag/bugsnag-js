import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'

export class AppConfigEnabledReleaseStagesScenario extends Scenario {
  constructor (configuration, extraData, jsConfig) {
    super()
    configuration.releaseStage = 'preprod'
    configuration.enabledReleaseStages = ['preprod', 'production']
  }

  run () {
    Bugsnag.notify(new Error('AppConfigEnabledReleaseStagesScenario'))
  }
}
