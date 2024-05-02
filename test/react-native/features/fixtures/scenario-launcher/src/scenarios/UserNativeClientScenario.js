import Scenario from './Scenario'
import { NativeInterface } from '../lib/native'

export class UserNativeClientScenario extends Scenario {
  run () {
    NativeInterface.runScenario('UserNativeClientScenario')
  }
}
