import Bugsnag from '@bugsnag/expo'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

Bugsnag.start()

export default class App extends React.Component {
  render () {
    return (
      <View style={styles.container}>
        <Text>Hello Expo!</Text>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center'
  }
})
