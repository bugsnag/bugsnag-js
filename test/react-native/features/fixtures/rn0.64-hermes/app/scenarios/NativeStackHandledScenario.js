import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'
import { NativeModules } from 'react-native'

export class NativeStackHandledScenario extends Scenario {
  async run () {
    try {
      await NativeModules.BugsnagTestInterface.runScenario('NativeStackHandledScenario')
    } catch (e) {
      Bugsnag.notify(e)
    }
  }
}
