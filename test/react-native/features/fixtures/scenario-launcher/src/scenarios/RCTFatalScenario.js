import Scenario from './Scenario'
import { NativeInterface } from '../lib/native'

export class RCTFatalScenario extends Scenario {
  run () {
    NativeInterface.runScenario('RCTFatalScenario')
  }
}
