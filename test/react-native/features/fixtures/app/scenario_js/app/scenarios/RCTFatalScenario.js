import Scenario from './Scenario'
import { NativeModules } from 'react-native'

export class RCTFatalScenario extends Scenario {
  run () {
    NativeModules.BugsnagTestInterface.runScenario('RCTFatalScenario')
  }
}
