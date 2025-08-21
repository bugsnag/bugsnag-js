import Scenario from './Scenario'
import { NativeModules } from 'react-native'

export class NativePromiseRejectionUnhandledScenario extends Scenario {
  async run () {
    await NativeModules.BugsnagTestInterface.runScenario('NativePromiseRejectionUnhandledScenario')
  }
}
