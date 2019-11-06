import React, { Component } from 'react'
import { View, Button } from 'react-native'
import { bugsnagClient, buildConfiguration } from './bugsnag'
import Bugsnag from '@bugsnag/expo'

export default class Sessions extends Component {
  autoSession = () => {
    let config = buildConfiguration()
    config.autoDetectErrors = false
    config.autoTrackSessions = true
    Bugsnag.createClient(config)
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
