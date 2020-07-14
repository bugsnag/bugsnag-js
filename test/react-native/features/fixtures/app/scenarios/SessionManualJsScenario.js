import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'

export class SessionManualJsScenario extends Scenario {
  constructor(configuration, extraData, jsConfig) {
    super()
    configuration.autoTrackSessions = false
  }
  run() {
    Bugsnag.startSession()
    setTimeout(() => {
      Bugsnag.notify(new Error('SessionManualJsScenarioA'), () => {}, () => {
        Bugsnag.pauseSession()
        setTimeout(() => {
          Bugsnag.notify(new Error('SessionManualJsScenarioB'), () => {}, () => {
            Bugsnag.startSession()
            setTimeout(() => {
              Bugsnag.notify(new Error('SessionManualJsScenarioC'))
            }, 1000)
          })
        }, 1000)
      })
    }, 1000)
  }
}
