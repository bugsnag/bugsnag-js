import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'

export class AppConfigEnabledReleaseStagesNoSendScenario extends Scenario {
  constructor (configuration, jsConfig) {
    super()
    configuration.releaseStage = 'testing'
    configuration.enabledReleaseStages = ['preprod', 'production']
    configuration.autoTrackSessions = true
  }

  run () {
    Bugsnag.notify(new Error('AppConfigEnabledReleaseStagesNoSendScenario'))
  }
}
