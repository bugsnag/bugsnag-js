import Scenario from './Scenario'
import { NativeInterface } from '../lib/native'

export class HandledNativeErrorScenario extends Scenario {
  run () {
    NativeInterface.runScenario('HandledNativeErrorScenario')
  }
}
