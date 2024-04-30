import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'
import { NativeInterface } from '../lib/native'

export class SessionNativeControlledManualJsScenario extends Scenario {
  constructor (configuration, jsConfig) {
    super()
    configuration.autoTrackSessions = false
  }

  async run () {
    await NativeInterface.runScenario('StartSessionScenario')
    await this.timeout(750)
    Bugsnag.notify(new Error('SessionJsControlledManualJsScenarioA'), () => {
    }, async () => {
      await this.timeout(750)
      await NativeInterface.runScenario('PauseSessionScenario')
      await this.timeout(750)
      Bugsnag.notify(new Error('SessionJsControlledManualJsScenarioB'), () => {
      }, async () => {
        await this.timeout(2500)
        await NativeInterface.runScenario('ResumeSessionScenario')
        await this.timeout(750)
        Bugsnag.notify(new Error('SessionJsControlledManualJsScenarioC'), () => {
        }, async () => {
          await this.timeout(750)
          await NativeInterface.runScenario('PauseSessionScenario')
          await this.timeout(750)
          await NativeInterface.runScenario('StartSessionScenario')
          await this.timeout(750)
          Bugsnag.notify(new Error('SessionJsControlledManualJsScenarioD'))
        })
      })
    })
  }
}
