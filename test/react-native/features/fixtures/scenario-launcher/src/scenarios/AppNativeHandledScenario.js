import Scenario from './Scenario'
import { NativeInterface } from '../lib/native'

export class AppNativeHandledScenario extends Scenario {
  constructor (configuration, jsConfig) {
    super()
    configuration.appVersion = '1.2.3'
    jsConfig.codeBundleId = '1.2.3-r00110011'
  }

  run () {
    NativeInterface.runScenario('AppNativeHandledScenario')
  }
}
