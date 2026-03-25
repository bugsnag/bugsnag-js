
import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'

export class AddOnErrorCallbackScenario extends Scenario {
  run () {
    Bugsnag.addOnError(event => {
      event.addMetadata('addonError', { scenario: true })
      return true
    })
    Bugsnag.notify(new Error('addonError scenario test'))
  }
}
