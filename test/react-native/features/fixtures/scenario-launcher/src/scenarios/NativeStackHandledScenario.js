import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'
import { NativeInterface } from '../lib/native'

export class NativeStackHandledScenario extends Scenario {
  async run () {
    try {
      await NativeInterface.runScenario('NativeStackHandledScenario')
    } catch (e) {
      Bugsnag.notify(e)
    }
  }
}
