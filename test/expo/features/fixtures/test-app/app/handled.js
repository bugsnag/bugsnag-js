import React, { Component } from 'react'
import { View, Button } from 'react-native'
import { bugsnagClient } from './bugsnag'

export default class Handled extends Component {
  handledError = () => {
    bugsnagClient.notify(new Error('HandledError'))
  }

  handledCaughtError = () => {
    try {
      throw new Error('HandledCaughtError');
    } catch (error) {
      bugsnagClient.notify(error);
    }
  }

  render() {
    return (
      <View>
        <Button accessibilityLabel="handledErrorButton"
          title="handledError"
          onPress={this.handledError}
        />
        <Button accessibilityLabel="handledCaughtErrorButton"
          title="handledCaughtError"
          onPress={this.handledCaughtError}
        />
      </View>
    )
  }
}