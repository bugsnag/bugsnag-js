import { Client, Plugin } from '@bugsnag/core'
import { Navigation } from 'react-native-navigation'

declare class BugsnagPluginReactNativeNavigation implements Plugin {
  constructor(navigation: typeof Navigation)

  load: (client: Client) => never
}

export default BugsnagPluginReactNativeNavigation
