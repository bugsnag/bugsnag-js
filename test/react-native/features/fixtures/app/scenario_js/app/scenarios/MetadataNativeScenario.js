import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'
import { NativeModules } from 'react-native'

export class MetadataNativeScenario extends Scenario {
  constructor (configuration, _extraData, _jsConfig) {
    super()
    configuration.configMetaData = {
      some_data: 'set via config',
      cleared_data: 'clear me'
    }
  }

  run () {
    Bugsnag.clearMetadata('nativedata', 'cleared_data')
    setTimeout(() => {
      NativeModules.BugsnagTestInterface.runScenario('MetadataNativeScenario')
    }, 500)
  }
}
