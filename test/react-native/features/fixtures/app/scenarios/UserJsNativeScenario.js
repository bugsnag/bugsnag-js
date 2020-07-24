import Scenario from './Scenario'
import { NativeModules } from 'react-native'

export class UserJsNativeScenario extends Scenario {
  run() {
    Bugsnag.setUser('123', 'bug@sn.ag', 'Bug Snag')
    NativeModules.BugsnagTestInterface.runScenario('UnhandledNativeErrorScenario', () => {})
  }
}
