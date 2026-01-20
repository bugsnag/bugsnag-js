import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'

export class HandledJsErrorScenario extends Scenario {
  run () {
    Bugsnag.notify(new Error('HandledJsErrorScenario'))
  }
}
