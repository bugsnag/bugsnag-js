import Scenario from './Scenario'
import { NativeInterface } from '../lib/native'

export class DeviceNativeUnhandledScenario extends Scenario {
  run () {
    NativeInterface.runScenario('DeviceNativeUnhandledScenario')
  }
}
