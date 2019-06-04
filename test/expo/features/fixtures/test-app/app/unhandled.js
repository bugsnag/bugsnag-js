import React, { Component } from 'react'
import { View, Button } from 'react-native'

export default class Unhandled extends Component {
  unhandledError = () => {
    throw new Error('UnhandledError')
  }

  unhandledPromiseRejection = () => {
    Promise.reject(new Error('UnhandledPromiseRejection'))
  }

  render() {
    return (
      <View>
        <Button accessibilityLabel="unhandledErrorButton"
          title="unhandledError"
          onPress={this.unhandledError}
        />
        <Button accessibilityLabel="unhandledPromiseRejectionButton"
          title="unhandledPromiseRejection"
          onPress={this.unhandledPromiseRejection}
        />
      </View>
    )
  }
}