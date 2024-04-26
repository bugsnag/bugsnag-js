import Scenario from './Scenario'
import { NativeInterface } from '../lib/native'

export class AppNativeUnhandledScenario extends Scenario {
  constructor (configuration, jsConfig) {
    super()
    configuration.appVersion = '1.2.3'
    jsConfig.codeBundleId = '1.2.3-r00110011'
  }

  run () {
    NativeInterface.runScenario('AppNativeUnhandledScenario')
  }
}
