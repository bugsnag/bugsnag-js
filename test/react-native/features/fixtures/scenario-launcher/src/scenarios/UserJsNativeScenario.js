import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'
import { NativeInterface } from '../lib/native'

export class UserJsNativeScenario extends Scenario {
  async run () {
    Bugsnag.setUser('123', 'bug@sn.ag', 'Bug Snag')
    await this.timeout(1000)
    NativeInterface.runScenario('UnhandledNativeErrorScenario')
  }
}
