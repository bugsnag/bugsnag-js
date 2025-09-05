import React, { useEffect, useState } from 'react'
import { SafeAreaView, StyleSheet, View, Text } from 'react-native'
import { launchScenario } from '@bugsnag/react-native-scenarios'

const App = () => {
  const [scenario, setScenario] = useState(null)

  useEffect(() => {
    launchScenario(setScenario)
  }, [])

  return (
    scenario !== null ? scenario.view() : (
      <SafeAreaView style={styles.container}>
        <View>
          <Text>React Native Test App</Text>
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
