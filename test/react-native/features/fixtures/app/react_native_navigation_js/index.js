import { Navigation } from 'react-native-navigation'
import HomeScreen from './screens/Home'
import DetailsScreen from './screens/Details'
import { View, Text, SafeAreaView, StyleSheet } from 'react-native'
import React, { useEffect } from 'react'
import { launchScenario } from './lib/ScenarioLauncher'

console.reportErrorsAsExceptions = false

export const AppScreen = () => {
  useEffect(() => {
    launchScenario()
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Text>React Native Navigation Test App</Text>
      </View>
    </SafeAreaView>
  )
}

Navigation.registerComponent('App', () => AppScreen)
Navigation.registerComponent('Home', () => HomeScreen)
Navigation.registerComponent('Details', () => DetailsScreen)
Navigation.events().registerAppLaunchedListener(async () => {
  Navigation.setRoot({
    root: {
      stack: {
        children: [
          {
            component: {
              name: 'App'
            }
          }
        ]
      }
    }
  })
})

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
})
