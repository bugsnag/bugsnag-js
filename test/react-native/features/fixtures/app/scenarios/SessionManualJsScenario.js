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
        setTimeout(() => {
          Bugsnag.pauseSession()
          setTimeout(() => {
            Bugsnag.notify(new Error('SessionManualJsScenarioB'), () => {}, () => {
              setTimeout(() => {
                Bugsnag.startSession()
                setTimeout(() => {
                  Bugsnag.notify(new Error('SessionManualJsScenarioC'))
                }, 750)
              }, 2500)
            })
          }, 750)
        }, 750)
      })
    }, 750)
  }
}
