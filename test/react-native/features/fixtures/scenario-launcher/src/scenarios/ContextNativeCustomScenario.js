import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'
import { NativeInterface } from '../lib/native'

export class ContextNativeCustomScenario extends Scenario {
  run () {
    Bugsnag.setContext('context-js')
    setTimeout(() => {
      NativeInterface.runScenario('ContextNativeCustomScenario')
    }, 100)
  }
}
