import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'

export class UnhandledOverrideJsErrorScenario extends Scenario {
  constructor (configuration, extraData, jsConfig) {
    super()
    jsConfig.onError = (event) => {
      event.unhandled = false
    }
  }

  async run () {
    Bugsnag.startSession()
    await this.timeout(750)
    throw new Error('UnhandledOverrideJsErrorScenario')
  }
}
