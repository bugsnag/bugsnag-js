import Scenario from '../core/Scenario'
import Bugsnag from '@bugsnag/react-native'
import BugsnagReactNativeNavigation from '@bugsnag/plugin-react-native-navigation'
import React, { useEffect } from 'react'
import { Text, View } from 'react-native'
import { Navigation } from 'react-native-navigation'

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

const ScreenA = (props) => {
  useEffect(() => {
    (async () => {
      await delay(200)
      Navigation.push(props.componentId, {
        component: {
          name: 'ScreenB'
        }
      })
    })()
  }, [])

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Screen A</Text>
    </View>
  )
}

const ScreenB = (props) => {
  useEffect(() => {
    (async () => {
      await delay(200)
      Navigation.push(props.componentId, {
        component: {
          name: 'ScreenC'
        }
      })
    })()
  }, [])

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Screen B</Text>
    </View>
  )
}

const ScreenC = (props) => {
  useEffect(() => {
    (async () => {
      await delay(200)
      Navigation.push(props.componentId, {
        component: {
          name: 'FinalScreen'
        }
      })
    })()
  }, [])

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Screen C</Text>
    </View>
  )
}

const FinalScreen = () => {
  useEffect(() => {
    (async () => {
      await delay(500)
      Bugsnag.notify(new Error('RapidNavigationError'))
    })()
  }, [])

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Final Screen</Text>
    </View>
  )
}

export class ReactNativeNavigationRapidNavigationScenario extends Scenario {
  constructor (configuration, jsConfig) {
    super()
    jsConfig.plugins = [new BugsnagReactNativeNavigation(Navigation)]
  }

  run () {
    Navigation.registerComponent('ScreenA', () => ScreenA)
    Navigation.registerComponent('ScreenB', () => ScreenB)
    Navigation.registerComponent('ScreenC', () => ScreenC)
    Navigation.registerComponent('FinalScreen', () => FinalScreen)

    Navigation.setRoot({
      root: {
        stack: {
          children: [
            {
              component: {
                name: 'ScreenA'
              }
            }
          ]
        }
      }
    })
  }
}
