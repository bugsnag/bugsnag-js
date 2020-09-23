import { Plugin } from '@bugsnag/core'
import { NavigationContainer } from '@react-navigation/native'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface BugsnagPluginReactNavigation extends Plugin { }
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
declare class BugsnagPluginReactNavigation {
  constructor()
}

export interface BugsnagPluginReactNavigationResult {
  createNavigationContainer(NavigationContainerComponent: typeof NavigationContainer): typeof NavigationContainer
}

// add a new call signature for the getPlugin() method that types the react plugin result
declare module '@bugsnag/core' {
  interface Client {
    getPlugin(id: 'reactNavigation'): BugsnagPluginReactNavigationResult | undefined
  }
}

export default BugsnagPluginReactNavigation
