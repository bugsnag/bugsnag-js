import React, { useEffect } from 'react'
import { SafeAreaView, StyleSheet, View, Text } from 'react-native'
import { launchScenario } from './lib/ScenarioLauncher'

const App = () => {
  useEffect(() => {
    launchScenario()
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Text>React Native Test App</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
})

export default App
