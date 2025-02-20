import React, { useEffect } from 'react'
import { SafeAreaView, StyleSheet, View, Text } from 'react-native'
import Bugsnag from '@bugsnag/react-native'

const App = () => {
  useEffect(() => {
    Bugsnag.notify(new Error('CLI Test Error'))
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Text>React Native CLI Test App</Text>
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
