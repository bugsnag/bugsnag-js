import React, { Component } from 'react'
import { View, Button } from 'react-native'
import { bugsnagClient } from './bugsnag'

export default class AppFeature extends Component {
  defaultApp = () => {
    bugsnagClient.notify(new Error('HandledError'))
  }

  enhancedApp = () => {
    bugsnagClient.notify(new Error('HandledError'), event => {
      event.app.releaseStage = 'enhancedReleaseStage',
      event.app.version = '5.5.5'
    })
  }

  render() {
    return (
      <View>
        <Button accessibilityLabel="defaultAppButton"
          title="defaultApp"
          onPress={this.defaultApp}
        />
        <Button accessibilityLabel="enhancedAppButton"
          title="enhancedApp"
          onPress={this.enhancedApp}
        />
      </View>
    )
  }
}
