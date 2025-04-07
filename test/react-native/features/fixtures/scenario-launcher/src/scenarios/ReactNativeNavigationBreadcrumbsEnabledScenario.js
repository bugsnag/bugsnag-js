import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'
import BugsnagReactNativeNavigation from '@bugsnag/plugin-react-native-navigation'
import React, { useEffect } from 'react'
import { Text, View } from 'react-native'
import { Navigation } from 'react-native-navigation'

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

const HomeScreen = (props) => {
  useEffect(() => {
    console.error('[BugsnagRNN] HomeScreen mounted')

    (async () => {
      await delay(1000)
      console.error('[BugsnagRNN] HomeScreen notifying error')
      Bugsnag.notify(new Error('HomeNavigationError'))
      await delay(250)
      console.error('[BugsnagRNN] HomeScreen navigating to Details')

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
    console.error('[BugsnagRNN] DetailsScreen mounted')

    (async () => {
      await delay(1000)
      console.error('[BugsnagRNN] DetailsScreen notifying error')
      Bugsnag.notify(new Error('DetailsNavigationError'))
      await delay(250)
      console.error('[BugsnagRNN] DetailsScreen throwing error')
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
    console.error('[BugsnagRNN] ReactNativeNavigationBreadcrumbsEnabledScenario constructor called')
    super()
    jsConfig.plugins = [new BugsnagReactNativeNavigation(Navigation)]
    console.error('[BugsnagRNN] ReactNativeNavigationBreadcrumbsEnabledScenario constructed')
  }

  componentDidMount () {
    console.error('[BugsnagRNN] ReactNativeNavigationBreadcrumbsEnabledScenario mounted')
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
