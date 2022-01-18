import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'
import { NativeModules } from 'react-native'

export class FeatureFlagsNativeCrashScenario extends Scenario {
  run () {
    Bugsnag.addFeatureFlag('demo_mode')
    Bugsnag.addFeatureFlag('sample_group', 'a')
    Bugsnag.addFeatureFlags([
      { name: 'should_not_be_reported_1' },
      { name: 'should_not_be_reported_2' },
      { name: 'should_not_be_reported_3', variant: 'with variant' }
    ])

    setTimeout(() => {
      NativeModules.BugsnagTestInterface.runScenario('FeatureFlagsNativeCrashScenario')
    }, 100)
  }
}
