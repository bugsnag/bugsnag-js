import Scenario from './Scenario'
import { NativeModules } from 'react-native'

export class DeviceNativeUnhandledScenario extends Scenario {
  run () {
    NativeModules.BugsnagTestInterface.runScenario('DeviceNativeUnhandledScenario')
  }
}
