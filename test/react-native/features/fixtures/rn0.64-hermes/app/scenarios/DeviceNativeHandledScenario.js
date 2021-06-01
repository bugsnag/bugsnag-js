import Scenario from './Scenario'
import { NativeModules } from 'react-native'

export class DeviceNativeHandledScenario extends Scenario {
  run () {
    NativeModules.BugsnagTestInterface.runScenario('DeviceNativeHandledScenario')
  }
}
