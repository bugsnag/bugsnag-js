import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'
import { NativeInterface } from '../lib/native'

export class GroupingDiscriminatorNativeScenario extends Scenario {
  run () {
    // Set initial grouping discriminator in JavaScript
    Bugsnag.setGroupingDiscriminator('grouping-discriminator-from-js')

    // Trigger the native scenario which will set the grouping discriminator
    setTimeout(async () => {
      await NativeInterface.runScenario('GroupingDiscriminatorNativeScenario')
      setTimeout(() => {
        Bugsnag.notify(new Error('GroupingDiscriminatorScenarioJS'))
      }, 100)
    }, 100)
  }
}
