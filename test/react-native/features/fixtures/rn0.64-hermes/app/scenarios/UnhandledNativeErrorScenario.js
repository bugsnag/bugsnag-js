import Scenario from './Scenario'
import { NativeModules } from 'react-native'

export class UnhandledNativeErrorScenario extends Scenario {
  run () {
    NativeModules.BugsnagTestInterface.runScenario('UnhandledNativeErrorScenario')
  }
}
