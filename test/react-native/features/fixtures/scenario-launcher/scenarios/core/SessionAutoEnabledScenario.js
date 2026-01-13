import Scenario from './Scenario'

export class SessionAutoEnabledScenario extends Scenario {
  constructor (configuration, jsConfig) {
    super()
    configuration.autoTrackSessions = true
  }

  run () {
  }
}
