import Scenario from './Scenario'
import { NativeInterface } from '../lib/native'

export class NativePromiseRejectionUnhandledScenario extends Scenario {
  async run () {
    await NativeInterface.runScenario('NativePromiseRejectionUnhandledScenario')
  }
}
