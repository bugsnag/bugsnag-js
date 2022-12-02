import Scenario from './Scenario'

export class AppJsUnhandledScenario extends Scenario {
  constructor (configuration, jsConfig) {
    super()
    configuration.appVersion = '1.2.3'
    configuration.enabledErrorTypes = { unhandledRejections: false }
    jsConfig.codeBundleId = '1.2.3-r00110011'
  }

  run () {
    throw new Error('AppJsUnhandledScenario')
  }
}
