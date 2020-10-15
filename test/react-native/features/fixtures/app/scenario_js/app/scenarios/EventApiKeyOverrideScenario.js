import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'

export class EventApiKeyOverrideScenario extends Scenario {
  run () {
    Bugsnag.notify(new Error('EventApiKeyOverrideScenario'), event => {
      event.apiKey = 'abf0deabf0deabf0deabf0deabf0de12'
    })
  }
}
