import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'
import { NativeInterface } from '../lib/native'

export class NativeFeatureFlagsScenario extends Scenario {
  run () {
    Bugsnag.addFeatureFlag('demo_mode')
    Bugsnag.addFeatureFlag('sample_group', 'a')
    Bugsnag.addFeatureFlags([
      { name: 'should_not_be_reported_1' },
      { name: 'should_not_be_reported_2' },
      { name: 'should_not_be_reported_3', variant: 'with variant' }
    ])

    setTimeout(() => {
      NativeInterface.runScenario('NativeFeatureFlagsScenario')
      setTimeout(() => {
        Bugsnag.notify(new Error())
      }, 100)
    }, 100)
  }
}
