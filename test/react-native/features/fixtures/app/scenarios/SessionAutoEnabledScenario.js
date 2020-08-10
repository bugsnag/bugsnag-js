import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'

export class SessionAutoEnabledScenario extends Scenario {
  constructor(configuration, extraData, jsConfig) {
    super()
    configuration.autoTrackSessions = true
  }
  run() {
  }
}
