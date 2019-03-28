import bugsnag from '@bugsnag/expo'
import React from 'react'
import { StyleSheet, Text, View, Button } from 'react-native'
const bugsnagClient = bugsnag({ apiKey: 'c8c0f735638c67f3348440fb1b2e7911' })

export default class App extends React.Component {
  render () {
    return (
      <View style={styles.container}>
        <Text>HELLLLLOOOOOO 1</Text>
        <Button onPress={() => bugsnagClient.notify(new Error('heyyy'))} title='Handled' />
        <Button onPress={() => { throw new Error('hoooo') }} title='Unhandled' />
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
