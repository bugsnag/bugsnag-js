import bugsnag from '@bugsnag/expo'
const bugsnagClient = bugsnag({ apiKey: 'c8c0f735638c67f3348440fb1b2e7911' })

import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

setTimeout(function () {
  console.log('throwwing a flerper')
  throw new Error('flerppp')
}, 3000)

export default class App extends React.Component {
  render () {
    return (
      <View style={styles.container}>
        <Text>HELLLLLOOOOOO 1</Text>
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
