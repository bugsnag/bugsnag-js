import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'

export class OnErrorCallbackScenario extends Scenario {
  run () {
    Bugsnag.notify(new Error('addonError scenario test'),event=>{
      event.addMetadata('onError', { scenario: true })
    })
  }
}
