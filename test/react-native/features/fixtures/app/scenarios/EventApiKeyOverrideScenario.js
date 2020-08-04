import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'

export class EventApiKeyOverrideScenario extends Scenario {
  constructor(configuration, extraData, jsConfig) {
    super()
  }

  run() {
    Bugsnag.notify(new Error('EventApiKeyOverrideScenario'), event => {
      event.setUser('123', 'bug@sn.ag', 'Bug Snag')
      event.apiKey = 'abf0deabf0deabf0deabf0deabf0de12'
    })
  }
}
