import Scenario from './Scenario'
import { NativeModules } from 'react-native'

export class NativeStackUnhandledScenario extends Scenario {
  async run () {
    await NativeModules.BugsnagTestInterface.runScenario('NativeStackUnhandledScenario')
  }
}
