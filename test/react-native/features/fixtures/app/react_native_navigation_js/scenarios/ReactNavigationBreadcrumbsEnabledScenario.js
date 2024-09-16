import Scenario from './Scenario'
import BugsnagReactNativeNavigation from '@bugsnag/plugin-react-native-navigation'
import { Navigation } from 'react-native-navigation'

export class ReactNavigationBreadcrumbsEnabledScenario extends Scenario {
  constructor (configuration, jsConfig) {
    super()
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
