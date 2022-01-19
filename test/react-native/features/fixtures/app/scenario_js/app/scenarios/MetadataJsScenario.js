import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'

export class MetadataJsScenario extends Scenario {
  constructor (configuration, extraData, jsConfig) {
    super()
    configuration.redactedKeys = ['redacted_data']
    jsConfig.metadata = {
      jsdata: {
        some_data: 'set via config'
      }
    }
  }

  run () {
    const recursiveMetadata = {}
    recursiveMetadata.data = 'some valid data'
    recursiveMetadata.circle = recursiveMetadata

    Bugsnag.addMetadata('jsdata', 'some_more_data', 'set via client')
    Bugsnag.addMetadata('jsdata', 'redacted_data', 'not present')
    Bugsnag.addMetadata('jsdata', 'recursive', recursiveMetadata)
    Bugsnag.notify(new Error('MetadataJsScenario'), (event) => {
      event.addMetadata('jsdata', 'even_more_data', 'set via event')
      event.addMetadata('jsarraydata', 'items', ['a', 'b', 'c'])
    })
  }
}
