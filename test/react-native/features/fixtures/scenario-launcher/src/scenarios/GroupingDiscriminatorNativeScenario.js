import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'
import { NativeInterface } from '../lib/native'
import { DeviceEventEmitter, NativeEventEmitter, NativeModules, Platform } from 'react-native'

export class GroupingDiscriminatorNativeScenario extends Scenario {
  run () {
    // Set initial grouping discriminator in JavaScript
    Bugsnag.setGroupingDiscriminator('grouping-discriminator-from-js')

    // Set up listener for native grouping discriminator updates
    const getEmitter = () => {
      switch (Platform.OS) {
        case 'android':
          return DeviceEventEmitter
        case 'ios':
          return new NativeEventEmitter(NativeModules.BugsnagReactNativeEmitter)
        default:
          return null
      }
    }

    const nativeEmitter = getEmitter()
    if (nativeEmitter) {
      const subscription = nativeEmitter.addListener('bugsnag::sync', (event) => {
        if (event.type === 'GroupingDiscriminatorUpdate') {
          // Send an error when we receive the grouping discriminator update from native
          Bugsnag.notify(new Error('GroupingDiscriminatorScenarioJS'))
          subscription.remove() // Clean up the listener
        }
      })
    }

    // Trigger the native scenario which will set the grouping discriminator
    setTimeout(() => {
      NativeInterface.runScenario('GroupingDiscriminatorNativeScenario')
    }, 100)
  }
}
