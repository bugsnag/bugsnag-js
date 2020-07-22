import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'

export class MetadataJsScenario extends Scenario {
  constructor (configuration, extraData, jsConfig) {
    super()
    jsConfig.metadata = {
      jsdata: {
        'some_data': 'set via config'
      }
    }
  }
  run() {
    Bugsnag.addMetadata('jsdata', 'some_more_data', 'set via client')
    Bugsnag.notify(new Error('MetadataJsScenario'), (event) => {
      event.addMetadata('jsdata', 'even_more_data', 'set via event')
    })
  }
}
