import { Navigation } from 'react-native-navigation'
import { View, Text, SafeAreaView, StyleSheet } from 'react-native'
import React, { useEffect } from 'react'
import { launchScenario } from '@bugsnag/react-native-scenarios'

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
Navigation.events().registerAppLaunchedListener(async () => {
  Navigation.setRoot({
    root: {
      component: {
        name: 'App'
      }
    }
  })
})

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
})
