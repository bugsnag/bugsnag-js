import Scenario from '../core/Scenario'
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
      Bugsnag.notify(new Error('FirstNavigationError'))
      await delay(250)
      Navigation.push(props.componentId, {
        component: {
          name: 'Settings'
        }
      })
    })()
  }, [])

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Home Screen</Text>
    </View>
  )
}

const SettingsScreen = () => {
  useEffect(() => {
    (async () => {
      await delay(1000)
      throw new Error('SecondNavigationError')
    })()
  }, [])

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Settings Screen</Text>
    </View>
  )
}

export class ReactNativeNavigationPersistenceScenario extends Scenario {
  constructor (configuration, jsConfig) {
    super()
    jsConfig.plugins = [new BugsnagReactNativeNavigation(Navigation)]
  }

  run () {
    Navigation.registerComponent('Home', () => HomeScreen)
    Navigation.registerComponent('Settings', () => SettingsScreen)

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
