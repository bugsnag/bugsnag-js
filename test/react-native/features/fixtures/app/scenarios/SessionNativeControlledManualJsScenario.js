import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'
import { NativeModules } from 'react-native'

export class SessionJsControlledManualJsScenario extends Scenario {
  constructor(configuration, extraData, jsConfig) {
    super()
    configuration.autoTrackSessions = false
  }
  run() {
    NativeModules.BugsnagTestInterface.runScenario('StartSessionScenario', () => {
      setTimeout(() => {
        Bugsnag.notify(new Error('SessionJsControlledManualJsScenarioA'), () => {}, () => {
          setTimeout(() => {
            NativeModules.BugsnagTestInterface.runScenario('PauseSessionScenario', () => {
              setTimeout(() => {
                Bugsnag.notify(new Error('SessionJsControlledManualJsScenarioB'), () => {}, () => {
                  setTimeout(() => {
                    NativeModules.BugsnagTestInterface.runScenario('ResumeSessionScenario', () => {
                      setTimeout(() => {
                        Bugsnag.notify(new Error('SessionJsControlledManualJsScenarioC'), () => {}, () => {
                          setTimeout(() => {
                            NativeModules.BugsnagTestInterface.runScenario('PauseSessionScenario', () => {
                              setTimeout(() => {
                                NativeModules.BugsnagTestInterface.runScenario('StartSessionScenario', () => {
                                  setTimeout(() => {
                                    Bugsnag.notify(new Error('SessionJsControlledManualJsScenarioD'))
                                  }, 750)
                                })
                              }, 750)
                            })
                          }, 750)
                        })
                      }, 750)
                    })
                  }, 2500)
                })
              }, 750)
            })
          }, 750)
        })
      }, 750)
    })
  }
}
