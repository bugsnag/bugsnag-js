import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'

export class SessionAutoDisabledScenario extends Scenario {
  constructor(configuration, extraData, jsConfig) {
    super()
    configuration.autoTrackSessions = false
  }
  run() {
  }
}
