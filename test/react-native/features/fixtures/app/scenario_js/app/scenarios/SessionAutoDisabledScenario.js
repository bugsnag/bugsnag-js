import Scenario from './Scenario'

export class SessionAutoDisabledScenario extends Scenario {
  constructor (configuration, jsConfig) {
    super()
    configuration.autoTrackSessions = false
  }

  run () {
  }
}
