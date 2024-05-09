import Scenario from './Scenario'
import { NativeInterface } from '../lib/native'

export class NativeStackUnhandledScenario extends Scenario {
  async run () {
    await NativeInterface.runScenario('NativeStackUnhandledScenario')
  }
}
