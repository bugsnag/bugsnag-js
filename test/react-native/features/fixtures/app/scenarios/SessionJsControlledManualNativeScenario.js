import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'
import { NativeModules } from 'react-native'

export class SessionJsControlledManualNativeScenario extends Scenario {
  constructor(configuration, extraData, jsConfig) {
    super()
    configuration.autoTrackSessions = false
  }
  run() {
    Bugsnag.startSession()
    setTimeout(() => {
      NativeModules.BugsnagTestInterface.runScenario('HandledNativeErrorScenario', () => {
        setTimeout(() => {
          Bugsnag.pauseSession()
          setTimeout(() => {
            NativeModules.BugsnagTestInterface.runScenario('HandledNativeErrorScenario', () => {
              setTimeout(() => {
                Bugsnag.resumeSession()
                setTimeout(() => {
                  NativeModules.BugsnagTestInterface.runScenario('HandledNativeErrorScenario', () => {
                    setTimeout(() => {
                      Bugsnag.pauseSession()
                      setTimeout(() => {
                        Bugsnag.startSession()
                        setTimeout(() => {
                          NativeModules.BugsnagTestInterface.runScenario('HandledNativeErrorScenario', () => {})
                        }, 1500)
                      }, 1500)
                    }, 1500)
                  })
                }, 1500)
              }, 5000)
            })
          }, 1500)
        }, 1500)
      })
    }, 1500)
  }
}
