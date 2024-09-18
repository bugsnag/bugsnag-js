import Scenario from './Scenario'
import { Navigation } from 'react-native-navigation'
import BugsnagReactNativeNavigation from '@bugsnag/plugin-react-native-navigation'

export class ReactNavigationBreadcrumbsDisabledScenario extends Scenario {
  constructor (configuration, jsConfig) {
    super()
    configuration.enabledBreadcrumbTypes = []
    jsConfig.plugins = [new BugsnagReactNativeNavigation(Navigation)]
  }

  run () {
    Navigation.setRoot({
      root: {
        stack: {
          children: [
            {
              component: {
                name: 'Home'
              }
            }
          ]
        }
      }
    })
  }
}
