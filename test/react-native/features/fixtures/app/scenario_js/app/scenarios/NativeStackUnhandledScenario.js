import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'
import { NativeModules } from 'react-native'

export class NativeStackUnhandledScenario extends Scenario {
  async run() {
    await NativeModules.BugsnagTestInterface.runScenario('NativeStackUnhandledScenario')
  }
}
