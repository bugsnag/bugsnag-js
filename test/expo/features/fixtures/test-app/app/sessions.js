import React, { Component } from 'react'
import { View, Button } from 'react-native'
import { endpoints, bugsnagClient } from './bugsnag'
import bugsnag from '@bugsnag/expo'

export default class Sessions extends Component {
  autoSession = () => {
    bugsnag({
      endpoints: endpoints,
      autoNotify: false,
      autoCaptureSessions: true
    })
  }

  manualSession = () => {
    bugsnagClient.startSession()
  }

  render() {
    return (
      <View>
        <Button accessibilityLabel="autoSessionButton"
          title="autoSession"
          onPress={this.autoSession}
        />
        <Button accessibilityLabel="manualSessionButton"
          title="manualSession"
          onPress={this.manualSession}
        />
      </View>
    )
  }
}