import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'
import { NativeInterface } from '../lib/native'

export class NativePromiseRejectionHandledScenario extends Scenario {
  async run () {
    try {
      await NativeInterface.runScenario('NativePromiseRejectionHandledScenario')
    } catch (e) {
      Bugsnag.notify(e)
    }
  }
}
