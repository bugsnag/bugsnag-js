import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'
import { NativeModules } from 'react-native'

export class UserJsNativeScenario extends Scenario {
  run() {
    Bugsnag.setUser('123', 'bug@sn.ag', 'Bug Snag')
    setTimeout(() => {
      NativeModules.BugsnagTestInterface.runScenario('UnhandledNativeErrorScenario', () => {})
    }, 1000)
  }
}
