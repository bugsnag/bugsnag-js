import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'

export class DeviceJsUnhandledScenario extends Scenario {
  run() {
    throw new Error('DeviceJsUnhandledScenario')
  }
}
