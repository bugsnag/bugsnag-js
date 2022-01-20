import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'
import * as React from 'react'
import { View, Text, Button } from 'react-native'
import { createStackNavigator } from '@react-navigation/stack'

export class ReactNavigationBreadcrumbsDisabledScenario extends Scenario {
  constructor (configuration, _jsConfig) {
    super()
    configuration.enabledBreadcrumbTypes = []
  }

  view () {
    const Stack = createStackNavigator()
    return (
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
    )
  }

  run () {
  }
}

function HomeScreen ({ navigation }) {
  return (
    <View style={ { flex: 1, alignItems: 'center', justifyContent: 'center' } }>
      <Text>Home Screen</Text>
      <Button title='Navigate'
        accessibilityLabel='navigate'
        onPress={ () => navigation.navigate('Details') }/>
      <Button title='Notify handled error'
        accessibilityLabel='sendHandled'
        onPress={ () => Bugsnag.notify(new Error('HomeNavigationError')) }/>
      <Button title='Set context'
        accessibilityLabel='setContext'
        onPress={ () => Bugsnag.setContext('homeSetContext') }/>
    </View>
  )
}

function DetailsScreen ({ navigation }) {
  return (
    <View style={ { flex: 1, alignItems: 'center', justifyContent: 'center' } }>
      <Text>Details Screen</Text>
      <Button title='Navigate'
        accessibilityLabel='navigate'
        onPress={ () => navigation.navigate('Home') }/>
      <Button title='Notify handled error'
        accessibilityLabel='sendHandled'
        onPress={ () => Bugsnag.notify(new Error('DetailsNavigationError')) }/>
      <Button title='Notify unhandled error'
        accessibilityLabel='sendUnhandled'
        onPress={ () => {
          throw new Error('DetailsNavigationUnhandledError')
        } }/>
      <Button title='Set context'
        accessibilityLabel='setContext'
        onPress={ () => Bugsnag.setContext('detailsSetContext') }/>
    </View>
  )
}
