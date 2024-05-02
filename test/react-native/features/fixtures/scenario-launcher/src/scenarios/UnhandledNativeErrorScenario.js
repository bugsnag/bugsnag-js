import Scenario from './Scenario'
import { NativeInterface } from '../lib/native'

export class UnhandledNativeErrorScenario extends Scenario {
  run () {
    NativeInterface.runScenario('UnhandledNativeErrorScenario')
  }
}
