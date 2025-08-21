import Scenario from './Scenario'
import { NativeModules } from 'react-native'

export class UnhandledNativeErrorSyncScenario extends Scenario {
  run () {
    NativeModules.BugsnagTestInterface.runScenarioSync('UnhandledNativeErrorScenario')
  }
}
