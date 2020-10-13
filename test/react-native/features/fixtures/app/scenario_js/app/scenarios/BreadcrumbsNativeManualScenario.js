import Scenario from './Scenario'
import { NativeModules } from 'react-native'

export class BreadcrumbsNativeManualScenario extends Scenario {
  run () {
    NativeModules.BugsnagTestInterface.runScenario('BreadcrumbsNativeManualScenario')
  }
}
