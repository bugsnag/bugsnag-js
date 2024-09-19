import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'
import BugsnagReactNativeNavigation from '@bugsnag/plugin-react-native-navigation'
import React, { useEffect } from 'react'
import { Text, View } from 'react-native'
import { Navigation } from 'react-native-navigation'

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

const HomeScreen = (props) => {
  useEffect(() => {
    (async () => {
      await delay(1000)
      Bugsnag.notify(new Error('HomeNavigationError'))
      await delay(250)
      Navigation.push(props.componentId, {
        component: {
          name: 'Details'
        }
      })
    })()
  }, [])

  return (
    <View style={ { flex: 1, alignItems: 'center', justifyContent: 'center' } }>
      <Text>Home Screen</Text>
    </View>
  )
}

const DetailsScreen = (props) => {
  useEffect(() => {
    (async () => {
      await delay(1000)
      Bugsnag.notify(new Error('DetailsNavigationError'))
      await delay(250)
      throw new Error('DetailsNavigationUnhandledError')
    })()
  }, [])

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Details Screen</Text>
    </View>
  )
}

export class ReactNativeNavigationBreadcrumbsEnabledScenario extends Scenario {
  constructor (configuration, jsConfig) {
    super()
    jsConfig.plugins = [new BugsnagReactNativeNavigation(Navigation)]
  }

  run () {
    Navigation.registerComponent('Home', () => HomeScreen)
    Navigation.registerComponent('Details', () => DetailsScreen)

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
