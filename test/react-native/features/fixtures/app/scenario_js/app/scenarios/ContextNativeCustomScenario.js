import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'
import { NativeModules } from 'react-native'

export class ContextNativeCustomScenario extends Scenario {
  run () {
    Bugsnag.setContext('context-js')
    setTimeout(() => {
      NativeModules.BugsnagTestInterface.runScenario('ContextNativeCustomScenario')
    }, 100)
  }
}
