import Scenario from './Scenario'
import { NativeInterface } from '../lib/native'

export class UnhandledNativeErrorSyncScenario extends Scenario {
  run () {
    NativeInterface.runScenarioSync('UnhandledNativeErrorScenario')
  }
}
