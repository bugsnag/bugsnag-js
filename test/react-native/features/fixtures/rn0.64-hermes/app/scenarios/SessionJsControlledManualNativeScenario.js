import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'
import { NativeModules } from 'react-native'

export class SessionJsControlledManualNativeScenario extends Scenario {
  constructor (configuration, extraData, jsConfig) {
    super()
    configuration.autoTrackSessions = false
  }

  async run () {
    Bugsnag.startSession()
    await this.timeout(1500)
    await NativeModules.BugsnagTestInterface.runScenario('HandledNativeErrorScenario')
    await this.timeout(1500)
    Bugsnag.pauseSession()
    await this.timeout(1500)
    await NativeModules.BugsnagTestInterface.runScenario('HandledNativeErrorScenario')
    await this.timeout(5000)
    Bugsnag.resumeSession()
    await this.timeout(1500)
    await NativeModules.BugsnagTestInterface.runScenario('HandledNativeErrorScenario')
    await this.timeout(1500)
    Bugsnag.pauseSession()
    await this.timeout(1500)
    Bugsnag.startSession()
    await this.timeout(1500)
    NativeModules.BugsnagTestInterface.runScenario('HandledNativeErrorScenario')
  }
}
