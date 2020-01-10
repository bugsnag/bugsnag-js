import React, { Component } from 'react'
import { View, Button } from 'react-native'
import { bugsnagClient } from './bugsnag'

export default class AppFeature extends Component {
  defaultDevice = () => {
    bugsnagClient.notify(new Error('DeviceDefaultError'))
  }

  callbackDevice = () => {
    bugsnagClient.notify(new Error('DeviceCallbackError'), event => {
      event.device.model = 'brandNewPhone',
      event.device.newThing = 'another new thing'
    })
  }

  render() {
    return (
      <View>
        <Button accessibilityLabel="deviceDefaultButton"
          title="defaultDevice"
          onPress={this.defaultDevice}
        />
        <Button accessibilityLabel="deviceCallbackButton"
          title="callbackDevice"
          onPress={this.callbackDevice}
        />
      </View>
    )
  }
}
