import Scenario from './Scenario'
import { NativeModules } from 'react-native'

export class MetadataNativeUnhandledScenario extends Scenario {
  constructor(configuration, extraData, jsConfig) {
    super()
    configuration.configMetaData = {
      "some_data": "set via config"
    }
  }

  run() {
    NativeModules.BugsnagTestInterface.runScenario('MetadataNativeUnhandledScenario', () => {})
  }
}
