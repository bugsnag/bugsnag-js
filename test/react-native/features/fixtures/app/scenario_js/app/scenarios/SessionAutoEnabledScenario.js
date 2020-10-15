import Scenario from './Scenario'

export class SessionAutoEnabledScenario extends Scenario {
  constructor (configuration, extraData, jsConfig) {
    super()
    configuration.autoTrackSessions = true
  }

  run () {
  }
}
