import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'
import { NativeModules } from 'react-native'

export class SessionNativeControlledManualJsScenario extends Scenario {
  constructor(configuration, extraData, jsConfig) {
    super()
    configuration.autoTrackSessions = false
  }
  async run() {
    NativeModules.BugsnagTestInterface.runScenario('StartSessionScenario', async () => {
      await this.timeout(750)
      Bugsnag.notify(new Error('SessionJsControlledManualJsScenarioA'), () => {}, async () => {
        await this.timeout(750)
        NativeModules.BugsnagTestInterface.runScenario('PauseSessionScenario', async () => {
          await this.timeout(750)
          Bugsnag.notify(new Error('SessionJsControlledManualJsScenarioB'), () => {}, async () => {
            await this.timeout(2500)
            NativeModules.BugsnagTestInterface.runScenario('ResumeSessionScenario', async () => {
              await this.timeout(750)
              Bugsnag.notify(new Error('SessionJsControlledManualJsScenarioC'), () => {}, async () => {
                await this.timeout(750)
                NativeModules.BugsnagTestInterface.runScenario('PauseSessionScenario', async () => {
                  await this.timeout(750)
                    NativeModules.BugsnagTestInterface.runScenario('StartSessionScenario', async () => {
                      await this.timeout(750)
                      Bugsnag.notify(new Error('SessionJsControlledManualJsScenarioD'))
                  })
                })
              })
            })
          })
        })
      })
    })
  }
}
