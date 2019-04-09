import React from 'react'
import { StyleSheet, Text, View, Button } from 'react-native'
import Handled from './app/handled'
import Unhandled from './app/unhandled'
import ErrorBoundary from './app/error_boundary'
import AppFeature from './app/app'

export default class App extends React.Component {
  render () {
    return (
      <View style={styles.container}>
        <Handled></Handled>
        <Unhandled></Unhandled>
        <ErrorBoundary></ErrorBoundary>
        <AppFeature></AppFeature>
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
