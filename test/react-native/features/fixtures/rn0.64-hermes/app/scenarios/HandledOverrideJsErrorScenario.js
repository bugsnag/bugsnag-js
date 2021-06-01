import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'

export class HandledOverrideJsErrorScenario extends Scenario {
  async run () {
    Bugsnag.startSession()
    await this.timeout(750)
    Bugsnag.notify(new Error('HandledOverrideJsErrorScenario'), event => {
      event.unhandled = true
    })
  }
}
