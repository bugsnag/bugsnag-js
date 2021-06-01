import Scenario from './Scenario'
import { NativeModules } from 'react-native'

export class UserNativeClientScenario extends Scenario {
  run () {
    NativeModules.BugsnagTestInterface.runScenario('UserNativeClientScenario')
  }
}
