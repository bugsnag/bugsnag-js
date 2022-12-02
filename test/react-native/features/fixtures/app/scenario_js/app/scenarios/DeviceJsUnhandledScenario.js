import Scenario from './Scenario'

export class DeviceJsUnhandledScenario extends Scenario {
  constructor (configuration) {
    super()
    configuration.enabledErrorTypes = { unhandledRejections: false }
  }

  run () {
    throw new Error('DeviceJsUnhandledScenario')
  }
}
