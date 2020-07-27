import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'

export class SessionJsControlledManualJsScenario extends Scenario {
  constructor(configuration, extraData, jsConfig) {
    super()
    configuration.autoTrackSessions = false
  }
  run() {
    Bugsnag.startSession()
    setTimeout(() => {
      Bugsnag.notify(new Error('SessionJsControlledManualJsScenarioA'), () => {}, () => {
        setTimeout(() => {
          Bugsnag.pauseSession()
          setTimeout(() => {
            Bugsnag.notify(new Error('SessionJsControlledManualJsScenarioB'), () => {}, () => {
              setTimeout(() => {
                Bugsnag.resumeSession()
                setTimeout(() => {
                  Bugsnag.notify(new Error('SessionJsControlledManualJsScenarioC'), () => {}, () => {
                    setTimeout(() => {
                      Bugsnag.pauseSession()
                      setTimeout(() => {
                        Bugsnag.startSession()
                        setTimeout(() => {
                          Bugsnag.notify(new Error('SessionJsControlledManualJsScenarioD'))
                        }, 750)
                      }, 750)
                    }, 750)
                  })
                }, 750)
              }, 2500)
            })
          }, 750)
        }, 750)
      })
    }, 750)
  }
}
