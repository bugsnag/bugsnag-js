import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'

export class ContextJsCustomScenario extends Scenario {
  constructor (configuration, jsConfig) {
    super()
    jsConfig.context = 'context-config'
  }

  run () {
    Bugsnag.notify(new Error('ContextJsCustomScenarioA'), () => {
    }, () => {
      setTimeout(() => {
        Bugsnag.setContext('context-client')
        Bugsnag.notify(new Error('ContextJsCustomScenarioB'), () => {
          setTimeout(() => {
            Bugsnag.notify(new Error('ContextJsCustomScenarioC'), event => {
              event.context = 'context-onerror'
            })
          }, 500)
        })
      }, 500)
    })
  }
}
