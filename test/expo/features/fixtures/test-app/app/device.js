import React, { Component } from 'react'
import { View, Button } from 'react-native'
import { bugsnagClient } from './bugsnag'

export default class AppFeature extends Component {
  defaultDevice = () => {
    bugsnagClient.notify(new Error('DeviceDefaultError'))
  }

  clientDevice = () => {
    bugsnagClient.set('device', 'osVersion', 'testOSVersion')
    bugsnagClient.set('device', 'newThing', 'this is new')
    bugsnagClient.notify(new Error('DeviceClientError'))
  }

  callbackDevice = () => {
    bugsnagClient.notify(new Error('DeviceCallbackError'), report => {
      report.set('device', 'model', 'brandNewPhone',)
      report.set('device', 'newThing', 'another new thing')
    })
  }

  render() {
    return (
      <View>
        <Button accessibilityLabel="deviceDefaultButton"
          title="defaultDevice"
          onPress={this.defaultDevice}
        />
        <Button accessibilityLabel="deviceClientButton"
          title="clientDevice"
          onPress={this.clientDevice}
        />
        <Button accessibilityLabel="deviceCallbackButton"
          title="callbackDevice"
          onPress={this.callbackDevice}
        />
      </View>
    )
  }
}
