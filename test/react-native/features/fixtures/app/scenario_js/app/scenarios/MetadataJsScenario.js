import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'

export class MetadataJsScenario extends Scenario {
  constructor (configuration, jsConfig) {
    super()
    configuration.redactedKeys = ['redacted_data']
    jsConfig.metadata = {
      jsdata: {
        some_data: 'set via config'
      }
    }
  }

  run () {
    Bugsnag.addMetadata('jsdata', 'some_more_data', 'set via client')
    Bugsnag.addMetadata('jsdata', 'redacted_data', 'not present')
    Bugsnag.notify(new Error('MetadataJsScenario'), (event) => {
      event.addMetadata('jsdata', 'even_more_data', 'set via event')
      event.addMetadata('jsarraydata', 'items', ['a', 'b', 'c'])
    })
  }
}
