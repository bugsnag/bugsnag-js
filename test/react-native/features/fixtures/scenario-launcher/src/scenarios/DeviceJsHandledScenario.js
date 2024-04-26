import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'

export class DeviceJsHandledScenario extends Scenario {
  run () {
    Bugsnag.notify(new Error('DeviceJsHandledScenario'))
  }
}
