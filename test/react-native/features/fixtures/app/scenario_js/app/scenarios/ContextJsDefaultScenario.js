import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'

export class ContextJsDefaultScenario extends Scenario {
  run () {
    Bugsnag.notify(new Error('ContextJsDefaultScenario'))
  }
}
