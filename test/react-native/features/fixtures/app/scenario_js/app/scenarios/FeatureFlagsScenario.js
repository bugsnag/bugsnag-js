import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'

export class FeatureFlagsScenario extends Scenario {
  constructor (configuration, jsConfig, extraData) {
    super()
    this.extraData = extraData

    if (extraData && extraData.includes('callback')) {
      jsConfig.onError = (event) => {
        event.addFeatureFlag('sample_group', 'a')
      }
    }
  }

  run () {
    Bugsnag.addFeatureFlag('demo_mode')

    Bugsnag.addFeatureFlags([
      { name: 'should_not_be_reported_1' },
      { name: 'should_not_be_reported_2' },
      { name: 'should_not_be_reported_3' }
    ])

    Bugsnag.clearFeatureFlag('should_not_be_reported_3')
    Bugsnag.clearFeatureFlag('should_not_be_reported_2')
    Bugsnag.clearFeatureFlag('should_not_be_reported_1')

    if (this.extraData && this.extraData.includes('cleared')) {
      Bugsnag.clearFeatureFlags()
    }

    if (this.extraData && this.extraData.includes('unhandled')) {
      throw new Error('FeatureFlagScenario unhandled')
    } else {
      Bugsnag.notify(new Error('FeatureFlagScenario handled'))
    }
  }
}
