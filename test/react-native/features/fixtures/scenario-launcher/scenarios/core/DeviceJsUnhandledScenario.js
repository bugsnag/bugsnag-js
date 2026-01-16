import Scenario from './Scenario'

export class DeviceJsUnhandledScenario extends Scenario {
  run () {
    throw new Error('DeviceJsUnhandledScenario')
  }
}
