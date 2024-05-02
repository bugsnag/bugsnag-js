import Scenario from './Scenario'
import { NativeInterface } from '../lib/native'

export class DeviceNativeHandledScenario extends Scenario {
  run () {
    NativeInterface.runScenario('DeviceNativeHandledScenario')
  }
}
