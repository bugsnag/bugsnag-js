import React, { Component } from 'react'
import { View, Button } from 'react-native'
import { bugsnagClient } from './bugsnag'

export default class IgnoreEvent extends Component {
  ignoreEventFalse = () => {
    bugsnagClient.notify(new Error('IgnoredError'), event => {
      return false
    })
  }

  render() {
    return (
      <View>
        <Button accessibilityLabel="ignoreEventFalseButton"
          title="ignoreEventFalse"
          onPress={this.ignoreEventFalse}
        />
      </View>
    )
  }
}
