import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'
import { NativeModules } from 'react-native'

export class SessionNativeControlledManualJsScenario extends Scenario {
  constructor (configuration, jsConfig) {
    super()
    configuration.autoTrackSessions = false
  }

  async run () {
    await NativeModules.BugsnagTestInterface.runScenario('StartSessionScenario')
    await this.timeout(750)
    Bugsnag.notify(new Error('SessionJsControlledManualJsScenarioA'), () => {
    }, async () => {
      await this.timeout(750)
      await NativeModules.BugsnagTestInterface.runScenario('PauseSessionScenario')
      await this.timeout(750)
      Bugsnag.notify(new Error('SessionJsControlledManualJsScenarioB'), () => {
      }, async () => {
        await this.timeout(2500)
        await NativeModules.BugsnagTestInterface.runScenario('ResumeSessionScenario')
        await this.timeout(750)
        Bugsnag.notify(new Error('SessionJsControlledManualJsScenarioC'), () => {
        }, async () => {
          await this.timeout(750)
          await NativeModules.BugsnagTestInterface.runScenario('PauseSessionScenario')
          await this.timeout(750)
          await NativeModules.BugsnagTestInterface.runScenario('StartSessionScenario')
          await this.timeout(750)
          Bugsnag.notify(new Error('SessionJsControlledManualJsScenarioD'))
        })
      })
    })
  }
}
