import React, { Component } from 'react'
import { View, Button } from 'react-native'
import { endpoints, bugsnagClient } from './bugsnag'
import Bugsnag from '@bugsnag/expo'

export default class Sessions extends Component {
  autoSession = () => {
    Bugsnag.createClient({
      endpoints: endpoints,
      autoDetectErrors: false,
      autoTrackSessions: true
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
