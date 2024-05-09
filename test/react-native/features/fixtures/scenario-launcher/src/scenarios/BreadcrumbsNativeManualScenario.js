import Scenario from './Scenario'
import { NativeInterface } from '../lib/native'

export class BreadcrumbsNativeManualScenario extends Scenario {
  run () {
    NativeInterface.runScenario('BreadcrumbsNativeManualScenario')
  }
}
