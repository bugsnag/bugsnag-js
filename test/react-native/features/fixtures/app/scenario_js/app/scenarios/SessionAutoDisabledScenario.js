import Scenario from './Scenario'

export class SessionAutoDisabledScenario extends Scenario {
  constructor (configuration, extraData, jsConfig) {
    super()
    configuration.autoTrackSessions = false
  }

  run () {
  }
}
