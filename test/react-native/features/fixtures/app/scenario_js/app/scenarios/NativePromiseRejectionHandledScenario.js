import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'
import { NativeModules } from 'react-native'

export class NativePromiseRejectionHandledScenario extends Scenario {
  async run () {
    try {
      await NativeModules.BugsnagTestInterface.runScenario('NativePromiseRejectionHandledScenario')
    } catch (e) {
      Bugsnag.notify(e)
    }
  }
}
