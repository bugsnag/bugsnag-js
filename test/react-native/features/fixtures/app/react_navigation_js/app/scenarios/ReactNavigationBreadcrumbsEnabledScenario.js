import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'
import BugsnagPluginReactNavigation from '@bugsnag/plugin-react-navigation'
import * as React from 'react'
import { View, Text } from 'react-native'
import { createStackNavigator } from '@react-navigation/stack'
import { NavigationContainer } from '@react-navigation/native'

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

export class ReactNavigationBreadcrumbsEnabledScenario extends Scenario {
  constructor (_configuration, jsConfig) {
    super()
    jsConfig.plugins = [new BugsnagPluginReactNavigation()]
  }

  view () {
    const BugsnagNavigationContainer = Bugsnag.getPlugin('reactNavigation').createNavigationContainer(NavigationContainer)
    const Stack = createStackNavigator()
    return (
      <BugsnagNavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="Home"
            component={ HomeScreen }
          />
          <Stack.Screen
            name="Details"
            component={ DetailsScreen }
          />
        </Stack.Navigator>
      </BugsnagNavigationContainer>
    )
  }

  run () {
  }
}

function HomeScreen ({ navigation }) {
  React.useEffect(() => {
    (async () => {
      await delay(100)
      Bugsnag.notify(new Error('HomeNavigationError'))
      await delay(250)
      navigation.navigate('Details')
    })()
  }, [])

  return (
    <View style={ { flex: 1, alignItems: 'center', justifyContent: 'center' } }>
      <Text>Home Screen</Text>
    </View>
  )
}

function DetailsScreen ({ navigation }) {
  React.useEffect(() => {
    (async () => {
      await delay(100)
      Bugsnag.notify(new Error('DetailsNavigationError'))
      await delay(250)
      throw new Error('DetailsNavigationUnhandledError')
    })()
  }, [])

  return (
    <View style={ { flex: 1, alignItems: 'center', justifyContent: 'center' } }>
      <Text>Details Screen</Text>
    </View>
  )
}
