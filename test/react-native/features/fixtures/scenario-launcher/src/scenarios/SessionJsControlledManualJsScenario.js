import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'

export class SessionJsControlledManualJsScenario extends Scenario {
  constructor (configuration, _jsConfig) {
    super()
    configuration.autoTrackSessions = false
  }

  async run () {
    Bugsnag.startSession()
    await this.timeout(750)
    Bugsnag.notify(new Error('SessionJsControlledManualJsScenarioA'), () => {
    }, async () => {
      await this.timeout(750)
      Bugsnag.pauseSession()
      await this.timeout(750)
      Bugsnag.notify(new Error('SessionJsControlledManualJsScenarioB'), () => {
      }, async () => {
        await this.timeout(2500)
        Bugsnag.resumeSession()
        await this.timeout(750)
        Bugsnag.notify(new Error('SessionJsControlledManualJsScenarioC'), () => {
        }, async () => {
          await this.timeout(750)
          Bugsnag.pauseSession()
          await this.timeout(750)
          Bugsnag.startSession()
          await this.timeout(750)
          Bugsnag.notify(new Error('SessionJsControlledManualJsScenarioD'))
        })
      })
    })
  }
}
