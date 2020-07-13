import Scenario from './Scenario'
import { NativeModules } from 'react-native'

export class MetadataNativeScenario extends Scenario {
  run() {
    NativeModules.BugsnagTestInterface.runScenario('MetadataNativeScenario', () => {})
  }
}
