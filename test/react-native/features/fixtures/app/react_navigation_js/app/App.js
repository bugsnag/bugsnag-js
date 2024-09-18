import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView
} from 'react-native'

import { launchScenario } from './lib/ScenarioLauncher'

const App = () => {
  const [scenario, setScenario] = useState(null)

  useEffect(() => {
    launchScenario(setScenario)
  }, [])

  return (
    scenario !== null ? scenario.view() : (
      <SafeAreaView style={styles.container}>
        <View>
          <Text>React Navigation Test App</Text>
        </View>
      </SafeAreaView>
    )
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
})

export default App
