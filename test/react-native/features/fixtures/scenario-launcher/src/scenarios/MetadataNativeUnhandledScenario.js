import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'
import { NativeInterface } from '../lib/native'

export class MetadataNativeUnhandledScenario extends Scenario {
  constructor (configuration, _jsConfig) {
    super()
    configuration.configMetaData = {
      some_data: 'set via config',
      cleared_data: 'clear me'
    }
  }

  run () {
    Bugsnag.clearMetadata('nativedata', 'cleared_data')
    setTimeout(() => {
      NativeInterface.runScenario('MetadataNativeUnhandledScenario')
    }, 500)
  }
}
